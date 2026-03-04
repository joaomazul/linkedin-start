import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { postPerformance } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()

        // Agrega engajamento por hora do dia e dia da semana
        const bestTimes = await db.select({
            day: sql<number>`extract(dow from published_at)::int`,
            hour: sql<number>`extract(hour from published_at)::int`,
            engagement: sql<number>`avg(engagement_rate)::float`
        })
            .from(postPerformance)
            .where(and(
                eq(postPerformance.userId, userId),
                sql`published_at is not null`
            ))
            .groupBy(sql`extract(dow from published_at)`, sql`extract(hour from published_at)`)

        return success(bestTimes)
    } catch (error) {
        logger.error({ err: error }, '[API Analytics] Erro em best-times:')
        return apiError('Erro ao carregar melhores horários', 500)
    }
}
