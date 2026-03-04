import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { appSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { createLogger } from '@/lib/logger'
import { resolvePostFromUrl } from '@/lib/campaigns/resolve-post'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const log = createLogger('api/campaigns/verify-post')

export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const { url } = await req.json()

        if (!url) {
            return apiError('URL é obrigatória', 400)
        }

        // Pegar conta ativa
        const [settings] = await db
            .select()
            .from(appSettings)
            .where(eq(appSettings.userId, userId))
            .limit(1)

        const accountId = settings?.activeLinkedinAccountId
        if (!accountId) {
            return apiError('Conecte sua conta LinkedIn primeiro', 400)
        }

        log.info({ url }, 'Verificando post')
        const resolved = await resolvePostFromUrl(url, accountId)

        return success(resolved)

    } catch (err: any) {
        log.error({ err: err.message }, 'Erro ao verificar post')
        return apiError(err.message || 'Falha ao verificar post', 400)
    }
}
