import { NextResponse } from 'next/server'
import { db } from '@/db'
import { monitoredProfiles } from '@/db/schema/profiles'
import { appSettings } from '@/db/schema'
import { eq, and, lt, sql, or, isNull } from 'drizzle-orm'
import { fetchAndCacheProfilePosts } from '@/app/api/linkedin/feed/route'
import { createLogger } from '@/lib/logger'
import { env } from '@/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const log = createLogger('cron/sync-feed')

const BATCH_SIZE = 5
const INTER_BATCH_DELAY_MS = 2000
const SKIP_IF_FETCHED_WITHIN_MS = 2 * 60 * 60 * 1000 // 2 hours

export async function GET(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        log.info('Iniciando sync automático do feed')

        // 1. Get all users that have active profiles
        const usersWithProfiles = await db
            .selectDistinct({ userId: monitoredProfiles.userId })
            .from(monitoredProfiles)
            .where(eq(monitoredProfiles.active, true))

        let totalSynced = 0
        let totalSkipped = 0
        let totalFailed = 0

        for (const { userId } of usersWithProfiles) {
            // 2. Get profiles that need syncing (not fetched recently)
            const threshold = new Date(Date.now() - SKIP_IF_FETCHED_WITHIN_MS)

            const profilesToSync = await db
                .select()
                .from(monitoredProfiles)
                .where(and(
                    eq(monitoredProfiles.userId, userId),
                    eq(monitoredProfiles.active, true),
                    or(
                        isNull(monitoredProfiles.lastFetchedAt),
                        lt(monitoredProfiles.lastFetchedAt, threshold)
                    )
                ))

            if (profilesToSync.length === 0) {
                totalSkipped++
                continue
            }

            log.info({ userId, count: profilesToSync.length }, 'Sincronizando perfis do usuário')

            // 3. Process in batches to respect rate limits
            for (let i = 0; i < profilesToSync.length; i += BATCH_SIZE) {
                const batch = profilesToSync.slice(i, i + BATCH_SIZE)

                const results = await Promise.allSettled(
                    batch.map(profile => fetchAndCacheProfilePosts(userId, profile))
                )

                results.forEach((result, idx) => {
                    if (result.status === 'fulfilled') {
                        totalSynced++
                    } else {
                        totalFailed++
                        log.warn({
                            profileId: batch[idx].id,
                            profileName: batch[idx].name,
                            err: result.reason?.message ?? String(result.reason),
                        }, 'Falha ao sincronizar perfil')
                    }
                })

                // Delay between batches to avoid rate limits
                if (i + BATCH_SIZE < profilesToSync.length) {
                    await new Promise(resolve => setTimeout(resolve, INTER_BATCH_DELAY_MS))
                }
            }
        }

        log.info({ totalSynced, totalSkipped, totalFailed }, 'Sync automático do feed concluído')

        return NextResponse.json({
            ok: true,
            synced: totalSynced,
            skipped: totalSkipped,
            failed: totalFailed,
        })

    } catch (err: unknown) {
        log.error({ err: (err as Error).message }, 'Erro crítico no sync automático do feed')
        return NextResponse.json({ error: (err as Error).message }, { status: 500 })
    }
}
