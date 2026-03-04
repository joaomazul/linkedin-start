import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { commentStyles, personas } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { checkRateLimit } from '@/lib/rate-limiter'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const log = createLogger('api/ai/generate-comment')

const Schema = z.object({
    postText: z.string().min(1).max(5000),
    postAuthor: z.string().max(255).optional().default(''),
    styleId: z.string().uuid('styleId deve ser um UUID válido'),
})

export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()

        // Rate limit: 20 gerações por minuto por usuário
        const limit = await checkRateLimit(`ai:${userId}`, 20, 60000)
        if (!limit.success) {
            const resetInSeconds = Math.ceil((limit.reset - Date.now()) / 1000)
            return apiError(
                `Muitas gerações. Aguarde ${resetInSeconds}s`,
                429,
                'RATE_LIMIT'
            )
        }

        const body = await req.json()
        const parsed = Schema.safeParse(body)
        if (!parsed.success) {
            const msg = parsed.error.issues[0]?.message ?? 'Dados inválidos'
            return apiError(msg, 400, 'INVALID_INPUT')
        }

        const { postText, postAuthor, styleId } = parsed.data

        // Busca o estilo no banco (SOMENTE do banco — nunca do body)
        const [style] = await db
            .select({ prompt: commentStyles.prompt, label: commentStyles.label, icon: commentStyles.icon })
            .from(commentStyles)
            .where(and(eq(commentStyles.id, styleId), eq(commentStyles.userId, userId)))
            .limit(1)

        if (!style) {
            return apiError('Estilo não encontrado', 404, 'STYLE_NOT_FOUND')
        }

        // Busca a persona do usuário no banco
        const [persona] = await db
            .select({ compiledPrompt: personas.compiledPrompt })
            .from(personas)
            .where(and(eq(personas.userId, userId), eq(personas.isActive, 'true')))
            .limit(1)

        const personaContext = persona?.compiledPrompt?.trim()
            ? `\n\nCONTEXTO DO COMENTARISTA:\n${persona.compiledPrompt}`
            : ''

        log.info({ userId, styleId, styleLabel: style.label }, 'Gerando comentários')

        // Gera 3 opções via OpenRouter
        const options = await generateCommentOptions({
            postText,
            postAuthor,
            stylePrompt: style.prompt,
            styleLabel: style.label,
            personaContext,
        })

        log.info({ userId, count: options.length }, 'Comentários gerados')
        return success({ options, style: { label: style.label, emoji: style.icon } })

    } catch (err) {
        log.error({ err: (err as Error).message }, 'Erro na geração')
        return apiError(
            err instanceof Error ? err.message : 'Erro ao gerar comentário',
            500,
            'AI_ERROR'
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────

async function generateCommentOptions(params: {
    postText: string
    postAuthor: string
    stylePrompt: string
    styleLabel: string
    personaContext: string
}): Promise<string[]> {
    const { postText, postAuthor, stylePrompt, styleLabel, personaContext } = params

    const systemPrompt = `Você é um especialista em LinkedIn B2B que escreve comentários estratégicos.
Seu objetivo é criar comentários que geram conversas, demonstram autoridade e atraem conexões.

REGRAS ABSOLUTAS:
- Máximo 3 linhas por comentário
- Nunca use emojis excessivos (máximo 1 por comentário, opcional)
- Nunca comece com "Ótimo post!" ou "Excelente conteúdo!" — clichês que ninguém lê
- Nunca mencione que é gerado por IA
- Escreva em português brasileiro natural
- Seja específico ao conteúdo do post, não genérico
- Cada opção deve ter uma abordagem diferente${personaContext}`

    const userPrompt = `POST DO LINKEDIN:
Autor: ${postAuthor || 'Autor desconhecido'}
Conteúdo: "${postText.slice(0, 2000)}"

ESTILO SOLICITADO: ${styleLabel}
INSTRUÇÃO DO ESTILO: ${stylePrompt}

Gere EXATAMENTE 3 opções de comentário diferentes para este post seguindo o estilo solicitado.
Cada opção deve ser distinta em abordagem, não apenas em palavras.

Responda APENAS com JSON válido, sem markdown, sem explicações:
{
  "options": [
    "primeira opção de comentário aqui",
    "segunda opção de comentário aqui",
    "terceira opção de comentário aqui"
  ]
}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
                'X-Title': 'LinkedFlow',
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL ?? 'anthropic/claude-opus-4',
                max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS ?? 800),
                temperature: 0.85,  // criatividade nas variações
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            }),
            signal: controller.signal,
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`OpenRouter ${response.status}: ${errorText.slice(0, 200)}`)
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content ?? ''

        // Remove markdown fences se houver
        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()

        const parsed = JSON.parse(cleaned)
        const options = parsed.options ?? parsed

        if (!Array.isArray(options) || options.length === 0) {
            throw new Error('IA retornou formato inválido')
        }

        // Garante strings e filtra vazios
        return options
            .map((o: unknown) => String(o ?? '').trim())
            .filter(Boolean)
            .slice(0, 3)

    } catch (err) {
        if ((err as Error).name === 'AbortError') {
            throw new Error('Timeout na geração (25s). Tente novamente.')
        }
        if (err instanceof SyntaxError) {
            throw new Error('Resposta da IA em formato inválido. Tente novamente.')
        }
        throw err
    } finally {
        clearTimeout(timeout)
    }
}
