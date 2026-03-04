import { NextRequest } from 'next/server'
import { db } from '@/db'
import { cadenceSuggestions } from '@/db/schema/cadence'
import { crmInteractions, crmPeople } from '@/db/schema/crm'
import { eq, and, sql } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { createApiResponse } from '@/lib/api-response'
import { executeLinkedInAction } from '@/lib/campaigns/execute-action'
import { appSettings } from '@/db/schema'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = await getAuthenticatedUserId()
        const { action, content, personId } = await req.json()

        // 1. Verificar sugestão
        const [suggestion] = await db
            .select()
            .from(cadenceSuggestions)
            .where(and(eq(cadenceSuggestions.id, id), eq(cadenceSuggestions.userId, userId)))
            .limit(1)

        if (!suggestion) return createApiResponse.notFound('Sugestão não encontrada')

        // 2. Executar ação no LinkedIn se solicitado
        if (action === 'execute') {
            const [settings] = await db.select().from(appSettings).where(eq(appSettings.userId, userId)).limit(1)
            const accountId = settings?.activeLinkedinAccountId

            if (!accountId) return createApiResponse.badRequest('Conta LinkedIn não configurada')

            const result = await executeLinkedInAction(
                suggestion.type as any,
                accountId,
                personId, // O target Id para DM/Invite é o profileId
                content || suggestion.suggestedContent
            )

            if (!result.success) {
                return createApiResponse.error(result.errorMessage || 'Falha na execução do LinkedIn')
            }
        }

        // 3. Registrar no CRM
        await db.insert(crmInteractions).values({
            userId,
            personId,
            type: suggestion.type as any,
            source: 'cadence',
            sourceId: suggestion.id,
            content: content || suggestion.suggestedContent,
            occurredAt: new Date()
        }).onConflictDoNothing()

        // 4. Marcar sugestão como completada
        await db.update(cadenceSuggestions)
            .set({ status: 'completed', updatedAt: new Date() })
            .where(eq(cadenceSuggestions.id, id))

        // 5. Atualizar perfil da pessoa no CRM
        await db.update(crmPeople)
            .set({
                lastInteractionAt: new Date(),
                interactionCount: sql`${crmPeople.interactionCount} + 1`,
                updatedAt: new Date()
            })
            .where(eq(crmPeople.id, personId))

        return createApiResponse.success({ completed: true })

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = await getAuthenticatedUserId()

        await db.update(cadenceSuggestions)
            .set({ status: 'dismissed', updatedAt: new Date() })
            .where(and(eq(cadenceSuggestions.id, id), eq(cadenceSuggestions.userId, userId)))

        return createApiResponse.success({ dismissed: true })
    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}
