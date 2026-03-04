import { refreshAllBrandVoices } from '@/lib/workers/brand-voice-refresher'
import { success, apiError } from '@/lib/utils/api-response'
import { createLogger } from '@/lib/logger'
import { env } from '@/env'

const log = createLogger('cron/refresh-brand-voice')

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
            return apiError('Unauthorized', 401)
        }

        // Dispara o worker (que é um loop simples neste estágio)
        // Nota: Em produção Vercel, isto tem timeout de 60s (hobby) ou mais (pro)
        await refreshAllBrandVoices()

        return success({ executed: true })
    } catch (error) {
        log.error({ err: error }, '[CRON] Erro ao executar refresh de brand voice')
        return apiError('Erro ao executar cron de refresh', 500)
    }
}
