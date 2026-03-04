import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { campaigns as campaignsTable } from '@/db/schema'
import { and, eq, desc, gte, lte, sql } from 'drizzle-orm'

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

        const campaigns = await db.select({
            id: campaignsTable.id,
            name: campaignsTable.name,
            status: campaignsTable.status,
            totalCaptured: campaignsTable.totalCaptured,
            totalApproved: campaignsTable.totalApproved,
            totalCompleted: campaignsTable.totalCompleted,
            conversionRate: sql<number>`case when total_captured > 0 then (total_completed::float / total_captured::float * 100) else 0 end`,
            updatedAt: campaignsTable.updatedAt
        })
            .from(campaignsTable)
            .where(and(
                eq(campaignsTable.userId, userId),
                gte(campaignsTable.createdAt, startDate),
                lte(campaignsTable.createdAt, endDate)
            ))
            .orderBy(desc(campaignsTable.updatedAt))

        return success(campaigns)
    } catch (error) {
        logger.error({ err: error }, '[API Analytics] Erro em campaigns:')
        return apiError('Erro ao carregar performance de campanhas', 500)
    }
}
