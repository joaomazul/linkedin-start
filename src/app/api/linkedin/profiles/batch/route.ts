import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { monitoredProfiles } from '@/db/schema/profiles'
import { profileGroups } from '@/db/schema/groups'
import { success, apiError } from '@/lib/utils/api-response'
import { createLogger } from '@/lib/logger'
import { fetchAndCacheProfilePosts } from '@/app/api/linkedin/feed/route'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const log = createLogger('api/profiles/batch')

const BatchSchema = z.object({
    urls: z.array(z.string().url()).min(1),
    groupId: z.string().uuid().optional(),
})

export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const body = await req.json()
        const parsed = BatchSchema.safeParse(body)

        if (!parsed.success) {
            return apiError('Lista de URLs inválida', 400)
        }

        const { urls, groupId } = parsed.data
        const results = []
        const errors = []

        let targetGroupId = groupId

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

        // In a real production app we might queue this, 
        // but for a small user base we can process sequentially or with limited concurrency.
        for (const url of urls) {
            try {
                // Determine initials and name from URL as temporary data before resolving
                const slug = url.split('/in/')[1]?.split('/')[0] || 'User'
                const name = slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
                const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

                const [newProfile] = await db
                    .insert(monitoredProfiles)
                    .values({
                        userId,
                        groupId,
                        linkedinUrl: url.trim(),
                        name: name,
                        initials: initials,
                        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                        active: true,
                    })
                    .onConflictDoNothing({ target: [monitoredProfiles.userId, monitoredProfiles.linkedinUrl] })
                    .returning()

                if (newProfile) {
                    results.push(newProfile)
                    // Trigger async fetch for posts (don't await to not block the whole batch)
                    fetchAndCacheProfilePosts(userId, newProfile).catch(err => {
                        log.warn({ profileId: newProfile.id, err: err.message }, 'Background sweep failed for batch profile')
                    })
                }
            } catch (err: any) {
                errors.push({ url, error: err.message })
            }
        }

        log.info({ userId, created: results.length, failed: errors.length }, 'Importação em lote concluída')

        return success({
            createdCount: results.length,
            failedCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (err) {
        log.error({ err: (err as Error).message }, 'Erro crítico no batch import')
        return apiError('Erro ao processar lote', 500)
    }
}
