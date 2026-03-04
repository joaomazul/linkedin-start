import { z } from 'zod'

const schema = z.object({
    DATABASE_URL: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    UNIPILE_API_KEY: z.string().min(1),
    UNIPILE_DSN: z.string().min(1),
    UNIPILE_LINKEDIN_ACCOUNT_ID: z.string().min(1),
    UNIPILE_REQUEST_TIMEOUT_MS: z.coerce.number().default(15000),
    UNIPILE_RETRY_ATTEMPTS: z.coerce.number().default(3),
    UNIPILE_RETRY_DELAY_MS: z.coerce.number().default(1000),
    OPENROUTER_API_KEY: z.string().min(1),
    OPENROUTER_MODEL: z.string().default('anthropic/claude-opus-4'),
    OPENROUTER_MAX_TOKENS: z.coerce.number().default(800),
    AI_REQUEST_TIMEOUT_MS: z.coerce.number().default(25000),
    LINKEDIN_MAX_COMMENT_LENGTH: z.coerce.number().default(1250),
    LINKEDIN_MIN_COMMENT_DELAY_SECONDS: z.coerce.number().default(30),
    RATE_LIMIT_AI_REQUESTS_PER_MINUTE: z.coerce.number().default(20),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    CRON_SECRET: z.string().default('not-set'),
    TZ: z.string().default('America/Sao_Paulo'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
})

const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NETLIFY === 'true' && process.env.CONTEXT === undefined

const parsed = schema.safeParse(process.env)

if (!parsed.success && !isBuildPhase) {
    const issues = parsed.error.issues.map(i => `  ${i.path}: ${i.message}`)
    throw new Error('❌ Variáveis de ambiente inválidas:\n' + issues.join('\n'))
}

if (!parsed.success && isBuildPhase) {
    const issues = parsed.error.issues.map(i => `  ${i.path}: ${i.message}`)
    console.warn('⚠️ [env] Variáveis de ambiente com problemas no build:\n' + issues.join('\n'))
}

export const env = (
    parsed.success
        ? parsed.data
        : ({} as z.infer<typeof schema>)
) as z.infer<typeof schema>
