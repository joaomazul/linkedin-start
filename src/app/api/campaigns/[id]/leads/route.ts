import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { campaignLeads } from '@/db/schema/campaigns'
import { eq, and, desc } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id: campaignId } = await params
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')

        const filters = [
            eq(campaignLeads.userId, userId),
            eq(campaignLeads.campaignId, campaignId)
        ]

        if (status) {
            filters.push(eq(campaignLeads.status, status as any))
        }

        const leads = await db
            .select()
            .from(campaignLeads)
            .where(and(...filters))
            .orderBy(desc(campaignLeads.createdAt))

        return success(leads)
    } catch (err: any) {
        return apiError('Falha ao buscar leads', 500)
    }
}
