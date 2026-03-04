import { logger } from '@/lib/logger'
import { NextRequest } from 'next/server'
import type { UnipileWebhookPayload } from '@/types/unipile.types'
import { success, apiError } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    // TODO Fase 4: validar assinatura do webhook (header X-Unipile-Signature)

    let payload: UnipileWebhookPayload
    try {
        payload = await req.json()
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
