import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { campaignEvents, campaigns } from '@/db/schema/campaigns'
import { eq, and, desc } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id: campaignId } = await params

        // Verifica que a campanha pertence ao usuário
        const [campaign] = await db
            .select({ id: campaigns.id })
            .from(campaigns)
            .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
            .limit(1)

        if (!campaign) return apiError('Campanha não encontrada', 404)

        const events = await db
            .select()
            .from(campaignEvents)
            .where(and(
                eq(campaignEvents.campaignId, campaignId),
                eq(campaignEvents.userId, userId)
            ))
            .orderBy(desc(campaignEvents.createdAt))
            .limit(100)

        return success(events)
    } catch (err: any) {
        return apiError('Erro ao buscar eventos', 500)
    }
}
