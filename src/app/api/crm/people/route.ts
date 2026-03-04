import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { crmPeople } from '@/db/schema/crm'
import { eq, desc, sql, and, ilike, or } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { createApiResponse } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return createApiResponse.unauthorized()

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100)
        const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

        let query = db.select().from(crmPeople).where(eq(crmPeople.userId, userId))

        const filters = [eq(crmPeople.userId, userId)]
        if (status) filters.push(eq(crmPeople.status, status))
        if (search) {
            filters.push(or(
                ilike(crmPeople.name, `%${search}%`),
                ilike(crmPeople.company, `%${search}%`),
                ilike(crmPeople.headline, `%${search}%`)
            ) as any)
        }

        const items = await db
            .select()
            .from(crmPeople)
            .where(and(...filters))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(crmPeople.lastInteractionAt), desc(crmPeople.createdAt))

        const [total] = await db
            .select({ count: sql`count(*)` })
            .from(crmPeople)
            .where(and(...filters))

        return createApiResponse.success({
            people: items,
            total: Number((total as any).count),
            limit,
            offset
        })

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}
