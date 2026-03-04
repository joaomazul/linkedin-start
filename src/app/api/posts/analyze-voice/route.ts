import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { appSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { analyzeBrandVoice } from '@/lib/posts/analyze-brand-voice'
import { checkRateLimit } from '@/lib/rate-limiter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()

        // Rate limit: 5 análises por minuto (opeação pesada)
        const limit = await checkRateLimit(`ai:voice:${userId}`, 5, 60000)
        if (!limit.success) {
            return apiError('Muitas análises solicitadas. Aguarde um minuto.', 429, 'RATE_LIMIT')
        }

        // Busca configurações para pegar o accountId e profileId (o "me")
        const [settings] = await db.select().from(appSettings).where(eq(appSettings.userId, userId)).limit(1)

        if (!settings?.activeLinkedinAccountId) {
            return apiError('Conta LinkedIn não configurada', 400)
        }

        // Nota: No Phase 1 o perfil monitorado é salvo. Aqui precisamos 
        // garantir que o usuário tenha um perfil "self" ou resolvê-lo.
        // Por simplicidade, assumirei que chamaremos o analyzeBrandVoice 
        // que resolverá o perfil principal se passarmos o accountId.

        const analysis = await analyzeBrandVoice(userId, settings.activeLinkedinAccountId, 'me')

        return success(analysis)
    } catch (error) {
        console.error(error)
        return apiError('Erro ao analisar voz da marca', 500)
    }
}
