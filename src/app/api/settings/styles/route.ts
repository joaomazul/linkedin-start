import { logger } from '@/lib/logger'
import { getStylesByUser, getActiveStylesByUser, createStyle, updateStyle, deleteStyle, reorderStyles } from '@/db/queries/styles.queries'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const { searchParams } = new URL(req.url)
        const activeOnly = searchParams.get('activeOnly') === 'true'

        const styles = activeOnly
            ? await getActiveStylesByUser(userId)
            : await getStylesByUser(userId)

        return success(styles)
    } catch (error) {
        logger.error({ err: error }, '[API] Erro ao buscar estilos:')
        return apiError('Erro ao buscar estilos', 500)
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const body = await req.json()

        const newStyle = await createStyle({
            userId,
            styleKey: `custom_${Math.random().toString(36).substr(2, 9)}`,
            label: body.label,
            icon: body.icon,
            description: body.description,
            prompt: body.prompt,
            isCustom: true,
            active: true,
            displayOrder: body.displayOrder || 99,
        })

        return success(newStyle, 201)
    } catch (error) {
        logger.error({ err: error }, '[API] Erro ao criar estilo:')
        return apiError('Erro ao criar estilo', 500)
    }
}

export async function PATCH(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const body = await req.json()
        const { id, ...data } = body

        if (!id) return apiError('ID obrigatório', 400)

        if (body.order && Array.isArray(body.order)) {
            await reorderStyles(userId, body.order)
            return success({ reordered: true })
        }

        const updated = await updateStyle(id, userId, data)
        return success(updated)
    } catch (error) {
        logger.error({ err: error }, '[API] Erro ao atualizar estilo:')
        return apiError('Erro ao atualizar estilo', 500)
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) return apiError('ID obrigatório', 400)

        await deleteStyle(id, userId)
        return success({ deleted: true })
    } catch (error) {
        logger.error({ err: error }, '[API] Erro ao deletar estilo:')
        return apiError('Erro ao deletar estilo', 500)
    }
}
