import type { OpenRouterRequest, OpenRouterResponse } from '@/types/openrouter.types'
import { env } from '@/env'

const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
export const OPENROUTER_MODEL = env.OPENROUTER_MODEL

if (!OPENROUTER_API_KEY) {
    throw new Error('[OpenRouter] OPENROUTER_API_KEY é obrigatório no .env.local')
}

export async function openrouterChat(
    payload: OpenRouterRequest
): Promise<OpenRouterResponse> {
    const timeoutMs = env.AI_REQUEST_TIMEOUT_MS || 25000
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || process.env.URL || 'https://linkedflow.app',
                'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'LinkedFlow',
            },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            const error = await res.json().catch(() => ({}))
            throw new Error(
                `[OpenRouter] ${res.status} ${res.statusText}: ${JSON.stringify(error)}`
            )
        }

        return res.json()
    } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
            throw new Error(`[OpenRouter] Tempo limite de requisição da IA excedido (${timeoutMs}ms)`)
        }
        throw err
    } finally {
        clearTimeout(id)
    }
}


