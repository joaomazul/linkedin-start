import { getAuthenticatedUserId } from '@/lib/auth/user'
import { fetchUserPosts, resolveProfileByIdentifier, UnipilePost } from '@/lib/unipile/profiles'
import { db } from '@/db'
import { posts } from '@/db/schema/posts'
import { monitoredProfiles } from '@/db/schema/profiles'
import { eq, and, desc, asc } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'
import { env } from '@/env'

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

        if (isManualSync) {
            logger.info({ userId, profiles: activeProfiles.length }, 'Sincronização manual solicitada. Buscando posts na Unipile.')

            // 2. Filtra perfis que já foram buscados recentemente (últimos 30 min)
            const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
            const profilesToSync = activeProfiles.filter(p =>
                !p.lastFetchedAt || new Date(p.lastFetchedAt) < thirtyMinAgo
            )
            const skippedCount = activeProfiles.length - profilesToSync.length

            if (skippedCount > 0) {
                logger.info({ skippedCount }, 'Perfis já sincronizados recentemente — pulando')
            }

            // 3. Processa em lotes de 5 para respeitar rate limits da Unipile
            const BATCH_SIZE = 5
            const INTER_BATCH_DELAY_MS = 1500
            let syncedCount = 0
            let failedCount = 0

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

            logger.info({ syncedCount, failedCount, skippedCount }, 'Sincronização manual concluída')
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
            _profile: row.profile // Para facilitar debug se necessário
        }))

        logger.info({ userId, count: items.length }, 'Feed filtrado retornado')
        return success({ items })

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
// Estratégia: usa provider_id salvo → sem necessidade de resolver novamente
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAndCacheProfilePosts(
    userId: string,
    profile: typeof monitoredProfiles.$inferSelect
): Promise<void> {

    let providerId = profile.linkedinProfileId

    // Se ainda não temos o provider_id: resolve agora e salva para próximas vezes
    if (!providerId) {
        if (!profile.publicIdentifier && !profile.linkedinUrl) {
            logger.warn({ profileId: profile.id }, 'Perfil sem identifier — impossível buscar posts')
            return
        }

        logger.info({ profileId: profile.id }, 'provider_id não encontrado — resolvendo...')

        let identifier = profile.publicIdentifier

        if (!identifier) {
            // Se o user já foi testado e o publicIdentifier estava nulo, podemos extrair:
            const match = profile.linkedinUrl.match(/linkedin\.com\/in\/([^/?#\s/]+)/)
            if (match) identifier = match[1]
        }

        if (!identifier) {
            logger.warn({ profileId: profile.id, url: profile.linkedinUrl }, 'Não foi possível extrair identifier da URL')
            return
        }

        try {
            const resolved = await resolveProfileByIdentifier(identifier)
            providerId = resolved.providerId

            // Salva o provider_id no banco (evita resolver novamente)
            await db
                .update(monitoredProfiles)
                .set({
                    linkedinProfileId: resolved.providerId,
                    publicIdentifier: resolved.publicIdentifier,
                    // Atualiza também os dados do perfil se estiverem vazios
                    name: profile.name || resolved.name,
                    role: profile.role || resolved.headline || undefined,
                    avatarUrl: profile.avatarUrl || resolved.avatarUrl || undefined,
                    followerCount: resolved.followerCount,
                    updatedAt: new Date(),
                })
                .where(eq(monitoredProfiles.id, profile.id))

            logger.info({ profileId: profile.id, providerId }, 'provider_id resolvido e salvo no banco')
        } catch (e: any) {
            logger.warn({ profileId: profile.id, error: e.message }, 'Falha ao resolver provider_id')
            return;
        }
    }

    // Busca posts usando o provider_id
    const maxPosts = 20
    let unipilePosts: UnipilePost[] = []

    try {
        const result = await fetchUserPosts(providerId, { limit: maxPosts })
        const tenDaysAgo = new Date()
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

        // Exige posts dos últimos 10 dias OU 15 dias para ter alguma margem.
        unipilePosts = result.posts.filter((p) => {
            if (!p.publishedAt) return false // Se a Unipile não sabe a data, ignoramos para não sujar o feed
            return new Date(p.publishedAt) >= tenDaysAgo
        })
    } catch (e: any) {
        logger.warn({ profileId: profile.id, providerId, error: e.message }, 'Falha ao buscar posts do perfil na Unipile')
        return;
    }

    if (unipilePosts.length === 0) {
        logger.info({ profileId: profile.id, providerId }, 'Nenhum post retornado pelo Unipile')
        await db
            .update(monitoredProfiles)
            .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
            .where(eq(monitoredProfiles.id, profile.id))
        return
    }

    // Upsert dos posts no banco
    // onConflictDoNothing evita duplicatas (posts.linkedin_post_id é UNIQUE)
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
                    : new Date(0), // Fallback para 1970 para os posts entrarem sempre no fundo e não dominarem o topo, mas idéalmente filtramos.
                isHidden: false,
            }))
        )
        .onConflictDoNothing({ target: [posts.userId, posts.linkedinPostId] })

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
