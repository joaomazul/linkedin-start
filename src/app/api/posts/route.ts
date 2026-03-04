import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { generatedPosts, brandVoiceCache, postTemplates } from '@/db/schema/posts'
import { personas } from '@/db/schema/personas'
import { eq, and, desc } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { generatePost } from '@/lib/posts/generate-post'
import { scorePost } from '@/lib/posts/score-post'
import { fetchArticleContent } from '@/lib/posts/fetch-article'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GenerateSchema = z.object({
    templateId: z.string().uuid(),
    inputType: z.enum(['idea', 'article_url', 'article_text']),
    inputContent: z.string().min(1),
    objective: z.string().optional(),
    icp: z.string().optional(),
})

export async function GET(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') || 'draft'

        const posts = await db.select()
            .from(generatedPosts)
            .where(and(eq(generatedPosts.userId, userId), eq(generatedPosts.status, status)))
            .orderBy(desc(generatedPosts.createdAt))

        return success(posts)
    } catch (error) {
        return apiError('Erro ao buscar posts', 500)
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()

        // Rate limit: 20 gerações por minuto por usuário
        const limit = await checkRateLimit(`ai:post:${userId}`, 20, 60000)
        if (!limit.success) {
            const resetInSeconds = Math.ceil((limit.reset - Date.now()) / 1000)
            return apiError(
                `Muitas gerações de post. Aguarde ${resetInSeconds}s`,
                429,
                'RATE_LIMIT'
            )
        }

        const body = await req.json()

        const parsed = GenerateSchema.safeParse(body)
        if (!parsed.success) return apiError('Dados inválidos', 400)

        const { templateId, inputType, inputContent, objective, icp } = parsed.data

        // 1. Resolve conteúdo se for URL
        let finalContent = inputContent
        if (inputType === 'article_url') {
            finalContent = await fetchArticleContent(inputContent)
        }

        // 2. Busca contextos (Persona + Brand Voice)
        const [[persona], [brandVoice]] = await Promise.all([
            db.select().from(personas).where(and(eq(personas.userId, userId), eq(personas.isActive, 'true'))).limit(1),
            db.select().from(brandVoiceCache).where(eq(brandVoiceCache.userId, userId)).limit(1)
        ])

        // 3. Gera o post
        const generation = await generatePost({
            userId,
            templateId,
            inputContent: finalContent,
            inputType,
            personaContext: persona?.compiledPrompt || undefined,
            brandVoiceSnapshot: brandVoice?.writingStyle || undefined,
            objective,
            icp
        })

        // 4. Score automático opcional
        const scoring = await scorePost(generation.content)

        // 5. Salva como rascunho
        const [newPost] = await db.insert(generatedPosts).values({
            userId,
            inputType,
            inputContent: finalContent,
            inputUrl: inputType === 'article_url' ? inputContent : null,
            format: 'short', // Ajustar para pegar do template
            body: generation.content,
            scoreOverall: scoring.overall,
            scoreHook: scoring.hook,
            scoreFeedback: scoring.feedback,
            brandVoiceSnapshot: brandVoice?.writingStyle,
            generationModel: generation.model,
            status: 'draft'
        }).returning()

        return success(newPost)
    } catch (error) {
        console.error(error)
        return apiError('Erro ao gerar post', 500)
    }
}
