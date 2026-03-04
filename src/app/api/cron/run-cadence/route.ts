import { NextRequest, NextResponse } from 'next/server'
import { runCadenceWorker } from '@/lib/workers/cadence-worker'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.WORKER_ENABLED === 'false') {
        return NextResponse.json({ ok: true, skipped: true })
    }

    try {
        await runCadenceWorker()
        return NextResponse.json({ ok: true, ran_at: new Date().toISOString() })
    } catch (error: any) {
        console.error('[cron/run-cadence] erro:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
