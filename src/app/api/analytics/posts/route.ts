import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { postPerformance, generatedPosts } from '@/db/schema'
import { and, eq, desc, gte, lte } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '30d'
        const format = searchParams.get('format')

        let days = 30
        if (period === '7d') days = 7
        if (period === '90d') days = 90

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - days)

        let query = db.select({
            id: postPerformance.id,
            generatedPostId: postPerformance.generatedPostId,
            linkedinPostId: postPerformance.linkedinPostId,
            likes: postPerformance.likes,
            comments: postPerformance.comments,
            shares: postPerformance.shares,
            engagementRate: postPerformance.engagementRate,
            format: postPerformance.format,
            publishedAt: postPerformance.publishedAt,
            body: generatedPosts.body
        })
            .from(postPerformance)
            .leftJoin(generatedPosts, eq(postPerformance.generatedPostId, generatedPosts.id))
            .where(and(
                eq(postPerformance.userId, userId),
                gte(postPerformance.publishedAt, startDate),
                lte(postPerformance.publishedAt, endDate),
                format ? eq(postPerformance.format, format) : undefined
            ))
            .orderBy(desc(postPerformance.engagementRate))

        const posts = await query

        return success(posts)
    } catch (error) {
        logger.error({ err: error }, '[API Analytics] Erro em posts:')
        return apiError('Erro ao carregar performance de posts', 500)
    }
}
