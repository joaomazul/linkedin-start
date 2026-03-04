import { runCampaignPoller } from '@/lib/workers/campaign-poller'
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
        // Roda em background sem dar await para não timeout no Vercel Cron (que tem limite de 10-60s)
        // Se o volume for alto, o ideal seria usar um Queue system, mas para o MVP rodamos assim.
        runCampaignPoller().catch(err => console.error('[Cron Poll Error]:', err))

        return success({ status: 'Campaign poller started' })
    } catch (err: any) {
        return apiError('Falha ao iniciar poller', 500)
    }
}
