import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'
import { validateUUID } from '@/lib/utils/validate-params'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { engagementInsights } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id } = await params
        const validation = validateUUID(id)
        if (!validation.valid) return validation.error

        await db.update(engagementInsights)
            .set({ isRead: true })
            .where(and(
                eq(engagementInsights.id, id),
                eq(engagementInsights.userId, userId)
            ))

        return success({ ok: true })
    } catch (error) {
        logger.error({ err: error }, '[API Analytics] Erro ao marcar insight como lido:')
        return apiError('Erro ao atualizar insight', 500)
    }
}
