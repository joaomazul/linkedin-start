import { logger } from '@/lib/logger'
import { NextRequest } from 'next/server'
import type { UnipileWebhookPayload } from '@/types/unipile.types'
import { success, apiError } from '@/lib/utils/api-response'
import { verifyUnipileSignature } from '@/lib/unipile/verify-signature'
import { env } from '@/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    const rawBody = await req.text()

    // Validar assinatura do webhook quando secret está configurado
    if (env.UNIPILE_WEBHOOK_SECRET) {
        const signature = req.headers.get('x-unipile-signature')
        if (!verifyUnipileSignature(rawBody, signature, env.UNIPILE_WEBHOOK_SECRET)) {
            logger.warn({ signature }, '[webhook/unipile] Assinatura inválida')
            return apiError('Assinatura inválida', 401)
        }
    } else {
        logger.warn('[webhook/unipile] UNIPILE_WEBHOOK_SECRET não configurado — assinatura não verificada')
    }

    let payload: UnipileWebhookPayload
    try {
        payload = JSON.parse(rawBody)
    } catch {
        return apiError('Payload inválido', 400)
    }

    logger.info({ event: payload.event, accountId: payload.account_id }, '[webhook/unipile]')

    switch (payload.event) {
        case 'new_message':
            // TODO: notificar UI em tempo real (Fase 4)
            break
        case 'comment_on_post':
            // TODO: invalidar cache do post
            break
        case 'new_connection':
            // TODO: adicionar à lista de conexões
            break
        default:
        // Evento desconhecido — loga e ignora
    }

    // Unipile espera 200 imediatamente, processamento é async
    return success({ received: true })
}
