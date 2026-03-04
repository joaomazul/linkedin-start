import { getAuthenticatedUserId } from '@/lib/auth/user'
import { resolveProfileByUrl } from '@/lib/unipile/profiles'
import { db } from '@/db'
import { monitoredProfiles } from '@/db/schema/profiles'
import { profileGroups } from '@/db/schema/groups'
import { eq, and, asc } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const log = createLogger('api/profiles')

// ── GET /api/linkedin/profiles ────────────────────────────────────────────────
// Lista os perfis monitorados do usuário

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()

        const profiles = await db
            .select()
            .from(monitoredProfiles)
            .where(eq(monitoredProfiles.userId, userId))
            .orderBy(asc(monitoredProfiles.displayOrder), asc(monitoredProfiles.createdAt))

        return success(profiles)
    } catch (err) {
        log.error({ err: (err as Error).message }, 'Erro ao listar perfis')
        return apiError(err instanceof Error ? err.message : 'Erro ao buscar perfis', 500)
    }
}

// ── POST /api/linkedin/profiles ───────────────────────────────────────────────
// Adiciona um novo perfil para monitorar

const AddProfileSchema = z.object({
    linkedinUrl: z.string()
        .min(1, 'URL obrigatória')
        .refine(
            url => url.includes('linkedin.com/in/') || /^[a-zA-Z0-9_-]+$/.test(url.trim()),
            { message: 'Use o formato: linkedin.com/in/nome-do-perfil' }
        ),
    groupId: z.string().uuid().optional(),
    // Dados opcionais pré-resolvidos pelo preview (para evitar 2ª chamada à Unipile)
    _resolved: z.object({
        providerId: z.string(),
        publicIdentifier: z.string(),
        name: z.string(),
        headline: z.string().optional(),
        avatarUrl: z.string().nullable().optional(),
        followerCount: z.number().optional(),
    }).optional(),
})

export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const body = await req.json()
        const parsed = AddProfileSchema.safeParse(body)

        if (!parsed.success) {
            return apiError(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400, 'INVALID_INPUT')
        }

        const { linkedinUrl, _resolved } = parsed.data

        // Usa dados pré-resolvidos do preview (se disponíveis) para evitar 2ª chamada
        let resolvedData = _resolved

        if (!resolvedData) {
            // Se não tem dados pré-resolvidos, resolve agora
            try {
                const profile = await resolveProfileByUrl(linkedinUrl)
                resolvedData = {
                    providerId: profile.providerId,
                    publicIdentifier: profile.publicIdentifier,
                    name: profile.name,
                    headline: profile.headline,
                    avatarUrl: profile.avatarUrl,
                    followerCount: profile.followerCount,
                }
            } catch (err) {
                log.warn({ linkedinUrl, err: (err as Error).message }, 'Não resolveu — salva sem dados Unipile')
            }
        }

        // Verifica limite
        const existing = await db.select({ id: monitoredProfiles.id })
            .from(monitoredProfiles)
            .where(and(eq(monitoredProfiles.userId, userId), eq(monitoredProfiles.active, true)))
        if (existing.length >= 50) {
            return apiError('Limite de 50 perfis atingido', 400, 'LIMIT_REACHED')
        }

        // Calcula display_order
        const all = await db.select({ displayOrder: monitoredProfiles.displayOrder })
            .from(monitoredProfiles).where(eq(monitoredProfiles.userId, userId))
        const maxOrder = all.at(-1)?.displayOrder ?? -1

        let targetGroupId = parsed.data.groupId || null

        // Se não informar grupo, busca ou cria o padrão "Sem Grupo"
        if (!targetGroupId) {
            const [existingGroup] = await db.select()
                .from(profileGroups)
                .where(and(
                    eq(profileGroups.userId, userId),
                    eq(profileGroups.name, 'Sem Grupo')
                ))
                .limit(1)

            if (existingGroup) {
                targetGroupId = existingGroup.id
            } else {
                const [newGroup] = await db.insert(profileGroups)
                    .values({
                        userId,
                        name: 'Sem Grupo',
                        color: '#64748b'
                    })
                    .returning()
                targetGroupId = newGroup.id
            }
        }

        const finalName = resolvedData?.name ?? 'Perfil LinkedIn'
        const profileColor = generateProfileColor(finalName)
        const initials = finalName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'P'

        const [newProfile] = await db
            .insert(monitoredProfiles)
            .values({
                userId,
                groupId: targetGroupId,
                linkedinUrl,
                linkedinProfileId: resolvedData?.providerId ?? null,
                publicIdentifier: resolvedData?.publicIdentifier ?? null,
                name: finalName,
                role: resolvedData?.headline ?? '',
                avatarUrl: resolvedData?.avatarUrl ?? null,
                color: profileColor,
                initials: initials,
                followerCount: resolvedData?.followerCount ?? 0,
                active: true,
                displayOrder: maxOrder + 1,
            })
            .returning()

        log.info({ profileId: newProfile.id, name: newProfile.name }, 'Perfil adicionado')

        // Fetch initial posts (last 10 days) immediately
        try {
            const { fetchAndCacheProfilePosts } = await import('@/app/api/linkedin/feed/route')
            await fetchAndCacheProfilePosts(userId, newProfile)
        } catch (syncErr) {
            log.warn({ profileId: newProfile.id, err: (syncErr as Error).message }, 'Failed initial posts sync, but profile was created.')
        }

        return success(newProfile, 201)

    } catch (err: unknown) {
        const msg = (err as Error)?.message || ''
        log.error({ err: err }, 'Erro ao adicionar perfil')

        if (msg.includes('mp_user_url_unique') || msg.includes('duplicate') || msg.includes('unique')) {
            return apiError('Este perfil já está sendo monitorado', 409)
        }

        return apiError(err instanceof Error ? err.message : 'Erro', 500, 'ADD_PROFILE_ERROR')
    }
}

// Gera cor baseada na inicial do nome (consistente, não random)
function generateProfileColor(name: string): string {
    const colors = [
        '#3B82F6', // blue
        '#8B5CF6', // violet
        '#EC4899', // pink
        '#F59E0B', // amber
        '#10B981', // emerald
        '#EF4444', // red
        '#06B6D4', // cyan
        '#84CC16', // lime
    ]
    const initial = name.charCodeAt(0) || 0
    return colors[initial % colors.length]
}
