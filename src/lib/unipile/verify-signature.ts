import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verifica a assinatura HMAC-SHA256 de webhooks do Unipile.
 * Usa timingSafeEqual para prevenir timing attacks.
 */
export function verifyUnipileSignature(
    rawBody: string,
    signatureHeader: string | null,
    secret: string
): boolean {
    if (!signatureHeader || !secret) return false

    const expected = createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')

    try {
        return timingSafeEqual(
            Buffer.from(signatureHeader),
            Buffer.from(expected)
        )
    } catch {
        return false
    }
}
