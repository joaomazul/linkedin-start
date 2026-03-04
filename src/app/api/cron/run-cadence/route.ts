import { NextRequest } from 'next/server'
import { runCadenceWorker } from '@/lib/workers/cadence-worker'
import { createLogger } from '@/lib/logger'
import { success, apiError } from '@/lib/utils/api-response'
import { env } from '@/env'

const log = createLogger('cron/run-cadence')

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return apiError('Unauthorized', 401)
    }

    if (process.env.WORKER_ENABLED === 'false') {
        return success({ skipped: true })
    }

    try {
        await runCadenceWorker()
        return success({ ran_at: new Date().toISOString() })
    } catch (error: any) {
        log.error({ err: error }, '[CRON] Erro ao executar cadence worker')
        return apiError(error.message, 500)
    }
}
