import { logger } from '@/lib/logger'
import { getCommentHistory } from '@/db/queries/comments.queries'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const { searchParams } = new URL(req.url)
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)

        const history = await getCommentHistory(userId, limit)

        return success(history)
    } catch (error) {
        logger.error({ err: error }, '[API] Erro ao buscar histórico:')
        return apiError('Erro ao buscar histórico', 500)
    }
}
