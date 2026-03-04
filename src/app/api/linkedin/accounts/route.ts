import { logger } from '@/lib/logger'

import { listAccounts } from '@/lib/unipile/accounts'
import { success, apiError } from '@/lib/utils/api-response'

import { getAuthenticatedUserId } from '@/lib/auth/user'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    try {
        await getAuthenticatedUserId()
        const accounts = await listAccounts()
        return success(accounts)
    } catch (err) {
        logger.error({ err }, '[/api/linkedin/accounts]')
        return apiError('Falha ao buscar contas Unipile', 502, 'UNIPILE_ERROR')
    }
}
