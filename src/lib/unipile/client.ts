import { env } from '@/env'
import { createLogger } from '@/lib/logger'

const log = createLogger('unipile/client')

// Erro específico para conta desconectada (401 do Unipile)
export class UnipileAuthError extends Error {
    constructor(message = 'Conta LinkedIn desconectada. Verifique em /settings/account') {
        super(message)
        this.name = 'UnipileAuthError'
    }
}

// Erro para rate limit (429 do Unipile)
export class UnipileRateLimitError extends Error {
    public retryAfterSeconds: number
    constructor(retryAfterSeconds: number) {
        super(`Rate limit do LinkedIn. Tente novamente em ${retryAfterSeconds}s`)
        this.name = 'UnipileRateLimitError'
        this.retryAfterSeconds = retryAfterSeconds
    }
}

function buildUrl(path: string): string {
    // UNIPILE_DSN = api4.unipile.com:13465 (sem https://)
    // Sempre adiciona https:// aqui
    const dsn = env.UNIPILE_DSN.replace(/^https?:\/\//, '') // remove se já tiver
    return `https://${dsn}/api/v1${path.startsWith('/') ? path : '/' + path}`
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export async function unipileFetch<T = unknown>(
    path: string,
    options: RequestInit = {},
    attempt = 1
): Promise<T> {
    const url = buildUrl(path)
    const controller = new AbortController()
    const timeoutId = setTimeout(
        () => controller.abort(),
        env.UNIPILE_REQUEST_TIMEOUT_MS
    )

    try {
        log.info({ url, method: options.method ?? 'GET', attempt }, 'Unipile request')

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': env.UNIPILE_API_KEY,
                ...options.headers,
            },
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Rate limit — tenta novamente com backoff
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('retry-after') ?? '60')
            log.warn({ retryAfter, attempt }, 'Unipile 429 — rate limit')

            if (attempt <= env.UNIPILE_RETRY_ATTEMPTS) {
                const delay = env.UNIPILE_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
                log.info({ delay, nextAttempt: attempt + 1 }, 'Aguardando antes de retry')
                await sleep(delay)
                return unipileFetch<T>(path, options, attempt + 1)
            }

            throw new UnipileRateLimitError(retryAfter)
        }

        // Conta desconectada
        if (response.status === 401) {
            log.error({ url }, 'Unipile 401 — conta desconectada')
            throw new UnipileAuthError()
        }

        // Outros erros HTTP
        if (!response.ok) {
            const body = await response.text().catch(() => '')
            log.error({ status: response.status, url, body }, 'Unipile erro HTTP')
            throw new Error(`Unipile erro ${response.status}: ${body.slice(0, 200)}`)
        }

        const data = await response.json() as T
        log.info({ url, status: response.status }, 'Unipile response OK')
        return data

    } catch (err) {
        clearTimeout(timeoutId)

        if ((err as Error).name === 'AbortError') {
            log.warn({ url, timeoutMs: env.UNIPILE_REQUEST_TIMEOUT_MS, attempt }, 'Unipile timeout')

            // Retry on timeout (up to max attempts)
            if (attempt <= env.UNIPILE_RETRY_ATTEMPTS) {
                const delay = env.UNIPILE_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
                log.info({ delay, nextAttempt: attempt + 1 }, 'Retrying after timeout')
                await sleep(delay)
                return unipileFetch<T>(path, options, attempt + 1)
            }

            throw new Error(`Timeout ao conectar com LinkedIn após ${attempt} tentativas (${env.UNIPILE_REQUEST_TIMEOUT_MS}ms)`)
        }

        // Re-lança erros específicos sem modificar
        if (err instanceof UnipileAuthError || err instanceof UnipileRateLimitError) {
            throw err
        }

        log.error({ url, err: (err as Error).message }, 'Unipile erro inesperado')
        throw err
    }
}
