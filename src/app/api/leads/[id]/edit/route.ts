import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { campaignLeads } from '@/db/schema/campaigns'
import { eq, and } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { validateUUID } from '@/lib/utils/validate-params'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id: leadId } = await params
        const validation = validateUUID(leadId)
        if (!validation.valid) return validation.error
        const { reply, dm } = await req.json()

        const [lead] = await db
            .select()
            .from(campaignLeads)
            .where(and(eq(campaignLeads.id, leadId), eq(campaignLeads.userId, userId)))
            .limit(1)

        if (!lead) return apiError('Lead não encontrado', 404)

        await db.update(campaignLeads)
            .set({
                generatedReply: reply !== undefined ? reply : lead.generatedReply,
                generatedDm: dm !== undefined ? dm : lead.generatedDm,
                updatedAt: new Date()
            })
            .where(eq(campaignLeads.id, lead.id))

        return success({ status: 'updated' })
    } catch (err: any) {
        return apiError('Erro ao atualizar lead', 500)
    }
}
