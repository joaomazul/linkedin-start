import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { monitoredProfiles } from '@/db/schema/profiles'
import { eq, and } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { validateUUID } from '@/lib/utils/validate-params'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UpdateSchema = z.object({
    active: z.boolean().optional(),
    name: z.string().max(255).optional(),
    role: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    displayOrder: z.number().int().optional(),
})

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id: profileId } = await params
        const validation = validateUUID(profileId)
        if (!validation.valid) return validation.error
        const body = await req.json()
        const parsed = UpdateSchema.safeParse(body)

        if (!parsed.success) {
            return apiError('Dados inválidos', 400)
        }

        const [updated] = await db
            .update(monitoredProfiles)
            .set({ ...parsed.data, updatedAt: new Date() })
            .where(and(
                eq(monitoredProfiles.id, profileId),
                eq(monitoredProfiles.userId, userId)
            ))
            .returning()

        if (!updated) return apiError('Perfil não encontrado', 404)

        logger.info({ profileId, changes: Object.keys(parsed.data) }, 'Perfil atualizado')
        return success(updated)

    } catch (err) {
        return apiError(err instanceof Error ? err.message : 'Erro', 500)
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id } = await params
        const validation = validateUUID(id)
        if (!validation.valid) return validation.error
        const body = await req.json()
        const parsed = UpdateSchema.safeParse(body)

        if (!parsed.success) {
            return apiError('Dados inválidos', 400)
        }

        const [updated] = await db
            .update(monitoredProfiles)
            .set({ ...parsed.data, updatedAt: new Date() })
            .where(and(
                eq(monitoredProfiles.id, id),
                eq(monitoredProfiles.userId, userId)
            ))
            .returning()

        if (!updated) return apiError('Perfil não encontrado', 404)

        logger.info({ profileId: id, changes: Object.keys(parsed.data) }, 'Perfil atualizado')
        return success(updated)

    } catch (err) {
        return apiError(err instanceof Error ? err.message : 'Erro', 500)
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id } = await params
        const validation = validateUUID(id)
        if (!validation.valid) return validation.error

        const [deleted] = await db
            .delete(monitoredProfiles)
            .where(and(
                eq(monitoredProfiles.id, id),
                eq(monitoredProfiles.userId, userId)
            ))
            .returning({ id: monitoredProfiles.id })

        if (!deleted) return apiError('Perfil não encontrado', 404)

        logger.info({ profileId: id }, 'Perfil removido')
        return success({ deleted: true })

    } catch (err) {
        return apiError(err instanceof Error ? err.message : 'Erro', 500)
    }
}
