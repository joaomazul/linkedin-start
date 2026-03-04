import { NextRequest } from 'next/server'
import { db } from '@/db'
import { crmPeople, crmInteractions } from '@/db/schema/crm'
import { eq, and, desc } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { createApiResponse } from '@/lib/utils/api-response'
import { validateUUID } from '@/lib/utils/validate-params'
import { openrouterChat, OPENROUTER_MODEL } from '@/lib/openrouter/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const validation = validateUUID(id)
        if (!validation.valid) return validation.error
        const userId = await getAuthenticatedUserId()
        if (!userId) return createApiResponse.unauthorized()

        // 1. Buscar a pessoa e suas últimas interações
        const [person] = await db
            .select()
            .from(crmPeople)
            .where(and(eq(crmPeople.id, id), eq(crmPeople.userId, userId)))
            .limit(1)

        if (!person) return createApiResponse.notFound('Pessoa não encontrada')

        const interactions = await db
            .select()
            .from(crmInteractions)
            .where(eq(crmInteractions.personId, id))
            .orderBy(desc(crmInteractions.occurredAt))
            .limit(10)

        // 2. Gerar o brief via IA
        const interactionSummary = interactions
            .map(i => `[${i.type} - ${i.occurredAt.toISOString()}]: ${i.content}`)
            .join('\n')

        const prompt = `Gere um "Strategic Brief" (resumo estratégico) para esta pessoa que estou prospectando no LinkedIn.
DADOS DA PESSOA:
Nome: ${person.name}
Headline: ${person.headline}
Empresa: ${person.company}
Status Atual: ${person.status}

HISTÓRICO RECENTE DE INTERAÇÕES:
${interactionSummary}

TAREFA:
Crie um resumo de 3-4 frases destacando:
1. Quem ela é e qual seu provável foco atual.
2. Como foi nossa última interação de destaque.
3. Uma sugestão de ângulo para a próxima abordagem (Next Step).

Responda em tom profissional e direto, sem enrolação.`

        const response = await openrouterChat({
            model: OPENROUTER_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500
        })

        const brief = response.choices[0]?.message?.content || 'Não foi possível gerar o brief.'

        // 3. Atualizar o banco
        await db.update(crmPeople)
            .set({
                aiBrief: brief,
                lastBriefAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(crmPeople.id, id))

        return createApiResponse.success({ brief })

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}
