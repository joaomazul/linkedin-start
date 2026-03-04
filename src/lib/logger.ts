// SERVER-ONLY: Do not import this module in client components or client hooks.
// Use console.log/console.error in client-side code instead.
import 'server-only'

type LogFn = (obj: Record<string, unknown> | string, msg?: string, ...args: unknown[]) => void

interface Logger {
    info: LogFn
    error: LogFn
    warn: LogFn
    debug: LogFn
    child: (bindings: Record<string, unknown>) => Logger
}

function createNoopLogger(): Logger {
    const noop: LogFn = () => {}
    return { info: noop, error: noop, warn: noop, debug: noop, child: () => createNoopLogger() }
}

function createConsoleLogger(): Logger {
    return {
        info: (obj, msg) => console.log('[INFO]', msg || obj, msg ? obj : ''),
        error: (obj, msg) => console.error('[ERROR]', msg || obj, msg ? obj : ''),
        warn: (obj, msg) => console.warn('[WARN]', msg || obj, msg ? obj : ''),
        debug: (obj, msg) => console.debug('[DEBUG]', msg || obj, msg ? obj : ''),
        child: () => createConsoleLogger(),
    }
}

let _logger: Logger

try {
    // Dynamic require to avoid Edge Functions bundling issues on Netlify
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pino = require('pino')
    _logger = pino({
        level: process.env.LOG_LEVEL || 'info',
        ...(process.env.NODE_ENV === 'development'
            ? {
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:HH:MM:ss',
                        ignore: 'pid,hostname',
                    },
                },
            }
            : {
                formatters: {
                    level: (label: string) => ({ level: label }),
                },
                timestamp: () => `,"time":"${new Date().toISOString()}"`,
            }),
    })
} catch {
    // Fallback: pino not available (Edge Runtime or bundling issue)
    _logger = typeof console !== 'undefined' ? createConsoleLogger() : createNoopLogger()
}

export const logger = _logger

export function createLogger(module: string): Logger {
    return _logger.child({ module })
}
