import { NextResponse } from 'next/server'
import { db } from '@/db'
import { comments } from '@/db/schema/comments'
import { posts } from '@/db/schema/posts'
import { lt, and, eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { env } from '@/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        // 1. Limpa rascunhos não utilizados há mais de 30 dias
        const draftsResult = await db.delete(comments).where(
            and(
                eq(comments.status, 'draft'),
                lt(comments.createdAt, thirtyDaysAgo)
            )
        ).returning({ deletedId: comments.id })

        // 2. Limpa posts do feed muito antigos que não receberam comentários ou salvamento
        const postsResult = await db.delete(posts).where(
            and(
                eq(posts.commentStatus, 'idle'),
                lt(posts.fetchedAt, thirtyDaysAgo)
            )
        ).returning({ deletedId: posts.id })

        logger.info({
            draftsDeleted: draftsResult.length,
            postsDeleted: postsResult.length
        }, '[CRON] Rotina de limpeza finalizada')

        return NextResponse.json({ ok: true, draftsDeleted: draftsResult.length, postsDeleted: postsResult.length })

    } catch (err: unknown) {
        logger.error({ err }, '[CRON] Falha na rotina de limpeza')
        return NextResponse.json({ error: (err as Error).message }, { status: 500 })
    }
}
