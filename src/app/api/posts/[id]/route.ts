import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { generatedPosts } from '@/db/schema/posts'
import { appSettings } from '@/db/schema/settings'
import { eq, and } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { publishLinkedInPost } from '@/lib/unipile/posts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id: postId } = await params

        // 1. Busca o post
        const [post] = await db.select()
            .from(generatedPosts)
            .where(and(eq(generatedPosts.id, postId), eq(generatedPosts.userId, userId)))
            .limit(1)

        if (!post) return apiError('Post não encontrado', 404)
        if (post.status === 'published') return apiError('Post já publicado', 400)

        // 2. Busca conta do Unipile
        const [settings] = await db.select().from(appSettings).where(eq(appSettings.userId, userId)).limit(1)
        if (!settings?.activeLinkedinAccountId) return apiError('Conta LinkedIn não configurada', 400)

        // 3. Publica!
        const result = await publishLinkedInPost(settings.activeLinkedinAccountId, post.body)

        // 4. Atualiza banco
        const [updated] = await db.update(generatedPosts)
            .set({
                status: 'published',
                publishedAt: new Date(),
                linkedinPostIdFromUnipile: result.id,
                updatedAt: new Date(),
            })
            .where(eq(generatedPosts.id, postId))
            .returning()

        return success(updated)
    } catch (error) {
        console.error(error)
        return apiError('Erro ao publicar post', 500)
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { id: postId } = await params
        const body = await req.json()

        // Filtramos o que pode ser atualizado via PATCH
        const { body: postBody, status, title } = body

        const [updated] = await db.update(generatedPosts)
            .set({
                body: postBody,
                status,
                title,
                updatedAt: new Date(),
            })
            .where(and(eq(generatedPosts.id, postId), eq(generatedPosts.userId, userId)))
            .returning()

        return success(updated)
    } catch (error) {
        return apiError('Erro ao atualizar post', 500)
    }
}
