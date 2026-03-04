import { runActionExecutor } from '@/lib/workers/action-executor'
import { success, apiError } from '@/lib/utils/api-response'
import { env } from '@/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization')
    const secret = process.env.CRON_SECRET || env.CRON_SECRET

    if (authHeader !== `Bearer ${secret}`) {
        return apiError('Não autorizado', 401)
    }

    if (process.env.WORKER_ENABLED === 'false') {
        return success({ status: 'Worker disabled via WORKER_ENABLED flag' })
    }

    try {
        runActionExecutor().catch(err => console.error('[Cron Execute Error]:', err))

        return success({ status: 'Action executor started' })
    } catch (err: any) {
        return apiError('Falha ao iniciar executor', 500)
    }
}
