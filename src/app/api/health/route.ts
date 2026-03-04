import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { env } from '@/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    const start = Date.now()
    try {
        const rows = await db.execute(sql`
      SELECT current_setting('timezone') AS tz,
             NOW() AT TIME ZONE 'America/Sao_Paulo' AS sp_now
    `)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = (rows as any).rows?.[0] ?? (rows as any)[0] ?? {}
        return Response.json({
            status: 'ok',
            timezone: row.tz ?? 'unknown',
            spNow: String(row.sp_now ?? ''),
            database: { status: 'connected', latencyMs: Date.now() - start },
            unipile: { accountId: env.UNIPILE_LINKEDIN_ACCOUNT_ID },
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        return Response.json({
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
            latencyMs: Date.now() - start,
        }, { status: 500 })
    }
}
