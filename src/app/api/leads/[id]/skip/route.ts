import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { campaignLeads } from '@/db/schema/campaigns'
import { eq, and } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id: leadId } = await params
        const { reason } = await req.json().catch(() => ({}))

        const [lead] = await db
            .select()
            .from(campaignLeads)
            .where(and(eq(campaignLeads.id, leadId), eq(campaignLeads.userId, userId)))
            .limit(1)

        if (!lead) return apiError('Lead não encontrado', 404)

        await db.update(campaignLeads)
            .set({
                status: 'skipped',
                skippedReason: reason || 'Manual skip',
                updatedAt: new Date()
            })
            .where(eq(campaignLeads.id, lead.id))

        return success({ status: 'skipped' })
    } catch (err: any) {
        return apiError('Erro ao pular lead', 500)
    }
}
