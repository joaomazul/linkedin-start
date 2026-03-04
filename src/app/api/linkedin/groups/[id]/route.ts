import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { profileGroups } from '@/db/schema/groups'
import { eq, and } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const log = createLogger('api/groups/[id]')

const UpdateGroupSchema = z.object({
    name: z.string().min(1, 'Nome do grupo é obrigatório').max(255).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id } = await params
        const body = await req.json()
        const parsed = UpdateGroupSchema.safeParse(body)

        if (!parsed.success) {
            return apiError(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400)
        }

        const [updated] = await db
            .update(profileGroups)
            .set({ ...parsed.data, updatedAt: new Date() })
            .where(and(
                eq(profileGroups.id, id),
                eq(profileGroups.userId, userId)
            ))
            .returning()

        if (!updated) return apiError('Grupo não encontrado', 404)

        log.info({ groupId: id, changes: Object.keys(parsed.data) }, 'Grupo atualizado')
        return success(updated)
    } catch (err) {
        log.error({ err: (err as Error).message }, 'Erro ao atualizar grupo')
        return apiError('Erro ao atualizar grupo', 500)
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id } = await params

        const [deleted] = await db
            .delete(profileGroups)
            .where(and(
                eq(profileGroups.id, id),
                eq(profileGroups.userId, userId)
            ))
            .returning({ id: profileGroups.id })

        if (!deleted) return apiError('Grupo não encontrado', 404)

        log.info({ groupId: id }, 'Grupo removido')
        return success({ deleted: true })
    } catch (err) {
        log.error({ err: (err as Error).message }, 'Erro ao remover grupo')
        return apiError('Erro ao remover grupo', 500)
    }
}
