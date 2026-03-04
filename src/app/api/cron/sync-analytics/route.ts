import { runDailyAnalyticsSync } from '@/lib/workers/analytics-syncer'
import { success, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'
import { env } from '@/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')

    // Proteção simples por token (Vercel Cron Token)
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return apiError('Não autorizado', 401)
    }

    try {
        // Tenta rodar em background se possível, ou aguarda se for pequeno
        // No Next.js API route, melhor aguardar se não for muito longo ou usar edge function
        await runDailyAnalyticsSync()
        return success({ message: 'Analytics sync completed' })
    } catch (error) {
        logger.error({ err: error }, '[CRON] Erro no sync de analytics:')
        return apiError('Erro ao rodar sync de analytics', 500)
    }
}
