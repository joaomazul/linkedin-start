import { getAuthenticatedUserId } from '@/lib/auth/user'
import { computeMetricsForPeriod, computeTrend } from '@/lib/analytics/compute-metrics'
import { success, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { engagementInsights, postPerformance, generatedPosts } from '@/db/schema'
import { and, eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '30d'

        let days = 30
        if (period === '7d') days = 7
        if (period === '90d') days = 90

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - days)

        const [metrics, trend, recentInsights, topPosts] = await Promise.all([
            computeMetricsForPeriod(userId, startDate, endDate),
            computeTrend(userId, startDate, endDate),
            db.select().from(engagementInsights)
                .where(and(
                    eq(engagementInsights.userId, userId),
                    eq(engagementInsights.isRead, false)
                ))
                .orderBy(desc(engagementInsights.createdAt))
                .limit(3),
            db.select({
                id: generatedPosts.id,
                body: generatedPosts.body,
                format: generatedPosts.format,
                likes: postPerformance.likes,
                comments: postPerformance.comments,
                engagementRate: postPerformance.engagementRate
            })
                .from(postPerformance)
                .innerJoin(generatedPosts, eq(postPerformance.generatedPostId, generatedPosts.id))
                .where(eq(postPerformance.userId, userId))
                .orderBy(desc(postPerformance.engagementRate))
                .limit(3)
        ])

        const metricsWithTrend = { ...metrics, trend }

        return success({
            metrics: metricsWithTrend,
            recentInsights,
            topPosts
        })
    } catch (error) {
        logger.error({ err: error }, '[API Analytics] Erro no overview:')
        return apiError('Erro ao carregar analytics', 500)
    }
}
