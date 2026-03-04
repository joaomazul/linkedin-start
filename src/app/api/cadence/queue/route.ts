import { NextRequest } from 'next/server'
import { db } from '@/db'
import { cadenceSuggestions } from '@/db/schema/cadence'
import { crmPeople } from '@/db/schema/crm'
import { eq, desc, and } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { createApiResponse } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return createApiResponse.unauthorized()

        const suggestions = await db
            .select({
                suggestion: cadenceSuggestions,
                personName: crmPeople.name,
                personAvatar: crmPeople.avatarUrl,
                personHeadline: crmPeople.headline
            })
            .from(cadenceSuggestions)
            .innerJoin(crmPeople, eq(cadenceSuggestions.personId, crmPeople.id))
            .where(and(
                eq(cadenceSuggestions.userId, userId),
                eq(cadenceSuggestions.status, 'pending')
            ))
            .orderBy(desc(cadenceSuggestions.urgencyScore), desc(cadenceSuggestions.createdAt))
            .limit(20)

        return createApiResponse.success({ suggestions })

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return createApiResponse.unauthorized()

        const { personId, reason, suggestedContent } = await req.json()

        const [newSuggestion] = await db.insert(cadenceSuggestions).values({
            userId,
            personId,
            type: 'manual_signal',
            reason: reason || 'Sinal ABM detectado exigindo ação.',
            suggestedContent: suggestedContent || 'Olá! Vi sua atualização recente e achei super interessante. Como estão as coisas?',
            status: 'pending',
            urgencyScore: 80
        }).returning()

        return createApiResponse.success(newSuggestion)

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}
