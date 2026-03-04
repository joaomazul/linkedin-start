import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { monitoredProfiles } from '@/db/schema/profiles'
import { success, apiError } from '@/lib/utils/api-response'
import { validateUUID } from '@/lib/utils/validate-params'
import { eq, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id: groupId } = await params
        const validation = validateUUID(groupId)
        if (!validation.valid) return validation.error
        const { active } = await req.json()

        if (typeof active !== 'boolean') {
            return apiError('O campo active deve ser booleano', 400)
        }

        await db
            .update(monitoredProfiles)
            .set({ active, updatedAt: new Date() })
            .where(and(
                eq(monitoredProfiles.userId, userId),
                eq(monitoredProfiles.groupId, groupId)
            ))

        logger.info({ userId, groupId, active }, 'Bulk toggle profiles in group')
        return success({ message: `Status do grupo atualizado para ${active ? 'ativo' : 'inativo'}` })

    } catch (error) {
        logger.error({ err: error }, '[API] Erro no bulk toggle do grupo')
        return apiError('Erro ao atualizar status do grupo', 500)
    }
}
