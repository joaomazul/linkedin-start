import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { engagementInsights } from '@/db/schema'
import { and, eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const { searchParams } = new URL(request.url)
        const unreadOnly = searchParams.get('unread') === 'true'

        const insights = await db.select()
            .from(engagementInsights)
            .where(and(
                eq(engagementInsights.userId, userId),
                unreadOnly ? eq(engagementInsights.isRead, false) : undefined
            ))
            .orderBy(desc(engagementInsights.createdAt))

        return success(insights)
    } catch (error) {
        logger.error({ err: error }, '[API Analytics] Erro em insights:')
        return apiError('Erro ao carregar insights', 500)
    }
}

// PATCH /api/analytics/insights/[id]/read is handled in a dynamic route or here if mapped differently
// For now, I'll create the main GET and a simple PATCH in /api/analytics/insights/[id]/route.ts
