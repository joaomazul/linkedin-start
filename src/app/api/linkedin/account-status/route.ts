import { NextResponse } from 'next/server'
import { checkAccountStatus } from '@/lib/unipile/account-status'
import { getSettingsByUser } from '@/db/queries/settings.queries'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { logger } from '@/lib/logger'
import { env } from '@/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()
        const settings = await getSettingsByUser(userId)
        const accountId = settings?.activeLinkedinAccountId || env.UNIPILE_LINKEDIN_ACCOUNT_ID

        if (!accountId) {
            return NextResponse.json({ status: 'NO_ACCOUNT' })
        }

        const status = await checkAccountStatus(accountId)
        return NextResponse.json({ status })
    } catch (e: unknown) {
        if ((e as Error).message === 'Não autenticado') return NextResponse.json({ status: 'UNAUTHENTICATED' }, { status: 401 })
        logger.error({ err: e }, 'Erro ao checar status da conta Unipile')
        return NextResponse.json({ status: 'ERROR' }, { status: 500 })
    }
}
