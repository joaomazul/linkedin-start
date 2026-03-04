import { getAuthenticatedUserId } from '@/lib/auth/user'
import { fetchUserPosts, resolveProfileByIdentifier, UnipilePost } from '@/lib/unipile/profiles'
import { db } from '@/db'
import { posts } from '@/db/schema/posts'
import { monitoredProfiles } from '@/db/schema/profiles'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()

        // 1. Busca perfis ativos no banco
        const activeProfiles = await db
            .select()
            .from(monitoredProfiles)
            .where(and(
                eq(monitoredProfiles.userId, userId),
                eq(monitoredProfiles.active, true)
            ))
            .orderBy(asc(monitoredProfiles.displayOrder))

        const { searchParams } = new URL(req.url)
        const isManualSync = searchParams.get('sync') === 'true'

        // Feed vazio é OK
        if (activeProfiles.length === 0) {
            logger.info({ userId }, 'Nenhum perfil ativo')
            return success({
                items: [],
                message: 'Adicione perfis na sidebar para ver o feed',
            })
        }

        let syncedCount = 0
        let failedCount = 0
        let skippedCount = 0
        const failedProfiles: string[] = []

        if (isManualSync) {
            logger.info({ userId, profiles: activeProfiles.length }, 'Sincronização manual solicitada')

            // Smart cooldown: 5min para manual (vs 30min que era antes)
            // Perfis nunca sincronizados são sempre incluídos
            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
            const profilesToSync = activeProfiles.filter(p =>
                !p.lastFetchedAt || new Date(p.lastFetchedAt) < fiveMinAgo
            )
            skippedCount = activeProfiles.length - profilesToSync.length

            if (skippedCount > 0) {
                logger.info({ skippedCount, syncing: profilesToSync.length }, 'Perfis sincronizados < 5min atrás — pulando')
            }

            // Lotes de 5 com 1s delay — otimizado para Netlify timeout (~10-26s)
            const BATCH_SIZE = 5
            const INTER_BATCH_DELAY_MS = 1000

            for (let i = 0; i < profilesToSync.length; i += BATCH_SIZE) {
                const batch = profilesToSync.slice(i, i + BATCH_SIZE)

                const results = await Promise.allSettled(
                    batch.map(profile => fetchAndCacheProfilePosts(userId, profile))
                )

                results.forEach((result, idx) => {
                    if (result.status === 'fulfilled') {
                        syncedCount++
                    } else {
                        failedCount++
                        failedProfiles.push(batch[idx].name || batch[idx].id)
                        logger.error({
                            profileId: batch[idx].id,
                            profileName: batch[idx].name,
                            err: result.reason?.message ?? String(result.reason),
                        }, 'Falha ao buscar posts do perfil — continuando com os demais')
                    }
                })

                // Delay entre lotes para não estourar rate limit
                if (i + BATCH_SIZE < profilesToSync.length) {
                    await new Promise(resolve => setTimeout(resolve, INTER_BATCH_DELAY_MS))
                }
            }

            logger.info({ syncedCount, failedCount }, 'Sincronização manual concluída')
        } else {
            logger.info({ userId }, 'Buscando posts cacheados do banco.')
        }

        // 4. Retorna posts do banco apenas de perfis ativos
        const allPosts = await db
            .select({
                post: posts,
                profile: monitoredProfiles
            })
            .from(posts)
            .innerJoin(monitoredProfiles, eq(posts.profileId, monitoredProfiles.id))
            .where(and(
                eq(posts.userId, userId),
                eq(posts.isHidden, false),
                eq(monitoredProfiles.active, true)
            ))
            .orderBy(desc(posts.postedAt))
            .limit(500)

        const items = allPosts.map(row => ({
            ...row.post,
            _profile: row.profile
        }))

        logger.info({ userId, count: items.length }, 'Feed filtrado retornado')
        return success({
            items,
            syncedCount,
            failedCount,
            skippedCount,
            failedProfiles,
        })

    } catch (err) {
        logger.error({ err: (err as Error).message }, 'Erro crítico no feed')
        return apiError(
            err instanceof Error ? err.message : 'Erro ao carregar feed',
            500
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Busca posts de um perfil e faz upsert no banco
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAndCacheProfilePosts(
    userId: string,
    profile: typeof monitoredProfiles.$inferSelect
): Promise<void> {

    let providerId = profile.linkedinProfileId

    // Se ainda não temos o provider_id: resolve agora e salva
    if (!providerId) {
        if (!profile.publicIdentifier && !profile.linkedinUrl) {
            throw new Error(`Perfil "${profile.name}" sem URL ou identifier configurado`)
        }

        logger.info({ profileId: profile.id }, 'provider_id não encontrado — resolvendo...')

        let identifier = profile.publicIdentifier

        if (!identifier) {
            const match = profile.linkedinUrl.match(/linkedin\.com\/in\/([^/?#\s/]+)/)
            if (match) identifier = match[1]
        }

        if (!identifier) {
            throw new Error(`Não foi possível extrair identifier de "${profile.linkedinUrl}"`)
        }

        const resolved = await resolveProfileByIdentifier(identifier)
        providerId = resolved.providerId

        // Salva o provider_id no banco (evita resolver novamente)
        await db
            .update(monitoredProfiles)
            .set({
                linkedinProfileId: resolved.providerId,
                publicIdentifier: resolved.publicIdentifier,
                name: profile.name || resolved.name,
                role: profile.role || resolved.headline || undefined,
                avatarUrl: profile.avatarUrl || resolved.avatarUrl || undefined,
                followerCount: resolved.followerCount,
                updatedAt: new Date(),
            })
            .where(eq(monitoredProfiles.id, profile.id))

        logger.info({ profileId: profile.id, providerId }, 'provider_id resolvido e salvo no banco')
    }

    // Busca posts usando o provider_id
    const maxPosts = 20

    const result = await fetchUserPosts(providerId, { limit: maxPosts })
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const unipilePosts = result.posts.filter((p) => {
        if (!p.publishedAt) return false
        return new Date(p.publishedAt) >= tenDaysAgo
    })

    if (unipilePosts.length === 0) {
        logger.info({ profileId: profile.id, providerId }, 'Nenhum post retornado pelo Unipile')
        await db
            .update(monitoredProfiles)
            .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
            .where(eq(monitoredProfiles.id, profile.id))
        return
    }

    // Upsert dos posts no banco — atualiza métricas se já existir
    await db
        .insert(posts)
        .values(
            unipilePosts.map(post => ({
                userId,
                profileId: profile.id,
                linkedinPostId: post.socialId ?? post.id,
                authorName: profile.name,
                authorHeadline: profile.role ?? '',
                authorAvatarUrl: profile.avatarUrl ?? '',
                text: post.text,
                imageUrls: post.imageUrl ? [post.imageUrl] : [],
                articleTitle: post.articleTitle ?? null,
                articleUrl: post.articleUrl ?? null,
                postUrl: post.shareUrl ?? `https://www.linkedin.com/feed/update/urn:li:activity:${post.socialId ?? post.id}`,
                likesCount: post.likesCount,
                commentsCount: post.commentsCount,
                repostsCount: post.repostsCount,
                postedAt: post.publishedAt
                    ? new Date(post.publishedAt)
                    : new Date(0),
                isHidden: false,
            }))
        )
        .onConflictDoUpdate({
            target: [posts.userId, posts.linkedinPostId],
            set: {
                likesCount: sql`EXCLUDED.likes_count`,
                commentsCount: sql`EXCLUDED.comments_count`,
                repostsCount: sql`EXCLUDED.reposts_count`,
                text: sql`EXCLUDED.text`,
                authorName: sql`EXCLUDED.author_name`,
                authorHeadline: sql`EXCLUDED.author_headline`,
                authorAvatarUrl: sql`EXCLUDED.author_avatar_url`,
                updatedAt: new Date(),
            },
        })

    // Atualiza lastFetchedAt do perfil
    await db
        .update(monitoredProfiles)
        .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
        .where(eq(monitoredProfiles.id, profile.id))

    logger.info({
        profileId: profile.id,
        providerId,
        postsCount: unipilePosts.length,
    }, 'Posts salvos no banco')
}
