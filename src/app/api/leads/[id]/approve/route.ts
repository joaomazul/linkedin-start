import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { campaignLeads, campaigns, campaignActions } from '@/db/schema/campaigns'
import { eq, and, sql } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { scheduleLeadsActions } from '@/lib/campaigns/schedule-actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id: leadId } = await params

        // 1. Buscar o lead e a campanha
        const [lead] = await db
            .select()
            .from(campaignLeads)
            .where(and(eq(campaignLeads.id, leadId), eq(campaignLeads.userId, userId)))
            .limit(1)

        if (!lead) return apiError('Lead não encontrado', 404)
        if (lead.status !== 'pending') return apiError('Lead já processado', 400)

        const [campaign] = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.id, lead.campaignId))
            .limit(1)

        if (!campaign) return apiError('Campanha não encontrada', 404)

        // 2. Agendar ações
        const scheduled = scheduleLeadsActions(campaign as any)

        // 3. Salvar ações e atualizar status em transação atômica
        const actionInserts = scheduled.map(action => ({
            campaignId: campaign.id,
            leadId: lead.id,
            userId: userId,
            type: action.type,
            status: 'queued' as const,
            content: action.type === 'reply' ? lead.generatedReply : (action.type === 'dm' ? lead.generatedDm : null),
            contentFinal: action.type === 'reply' ? lead.generatedReply : (action.type === 'dm' ? lead.generatedDm : null),
            scheduledFor: action.scheduledFor
        }))

        await db.transaction(async (tx) => {
            if (actionInserts.length > 0) {
                await tx.insert(campaignActions).values(actionInserts)
            }

            await tx.update(campaignLeads)
                .set({ status: 'approved', approvedAt: new Date(), updatedAt: new Date() })
                .where(eq(campaignLeads.id, lead.id))

            await tx.update(campaigns)
                .set({
                    totalApproved: sql`${campaigns.totalApproved} + 1`,
                    updatedAt: new Date()
                })
                .where(eq(campaigns.id, campaign.id))
        })

        return success({ status: 'approved', actionsScheduled: actionInserts.length })

    } catch (err: any) {
        return apiError(err.message || 'Erro ao aprovar lead', 500)
    }
}
