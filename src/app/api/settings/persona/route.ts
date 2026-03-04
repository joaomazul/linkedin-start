import { logger } from '@/lib/logger'
import { getActivePersona, upsertPersona } from '@/db/queries/settings.queries'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function buildPersonaPrompt(data: Record<string, unknown>): string {
    const parts = []
    if (data.personaName) parts.push(`Você é ${data.personaName}.`)
    if (data.role || data.company) {
        parts.push(`Você atua como ${data.role || 'um profissional'} ${data.company ? 'na ' + data.company : ''}.`)
    }
    if (data.niche) parts.push(`Seu nicho de atuação/interesse é: ${data.niche}.`)
    if (data.tone) parts.push(`Seu tom de voz deve ser: ${data.tone}.`)
    if (data.goals) parts.push(`Seus objetivos principais ao comentar são: ${data.goals}.`)
    if (data.avoid) parts.push(`EVITE ESTRITAMENTE: ${data.avoid}.`)
    if (data.customPrompt) parts.push(`\nDiretrizes adicionais:\n${data.customPrompt}`)

    return parts.join(' ')
}

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()
        const persona = await getActivePersona(userId)
        return success(persona)
    } catch (error) {
        logger.error({ err: error }, '[API] Erro ao buscar persona:')
        return apiError('Erro ao buscar persona', 500)
    }
}

export async function PUT(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const body = await req.json()

        const compiledPrompt = buildPersonaPrompt(body)

        const updated = await upsertPersona(userId, {
            ...body,
            compiledPrompt,
            compiledAt: new Date(),
        })

        return success(updated)
    } catch (error) {
        logger.error({ err: error }, '[API] Erro ao atualizar persona:')
        return apiError('Erro ao atualizar persona', 500)
    }
}
