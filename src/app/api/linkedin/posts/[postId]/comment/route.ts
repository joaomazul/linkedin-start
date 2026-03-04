import { getAuthenticatedUserId } from '@/lib/auth/user'
import { unipileFetch } from '@/lib/unipile/client'
import { db } from '@/db'
import { comments, posts } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { createLogger } from '@/lib/logger'
import { env } from '@/env'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const log = createLogger('api/posts/comment')

const Schema = z.object({
    text: z.string().min(1, 'Comentário não pode ser vazio').max(1250, 'Máximo 1250 caracteres'),
    styleId: z.string().uuid().optional(),
})

export async function POST(
    req: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId()
        const { postId: linkedinPostId } = await params
        const body = await req.json()
        const parsed = Schema.safeParse(body)

        if (!parsed.success) {
            return apiError(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400, 'INVALID_INPUT')
        }

        const { text, styleId } = parsed.data

        // Verifica delay mínimo entre comentários (anti-spam)
        const [lastComment] = await db
            .select({ postedAt: comments.postedAt })
            .from(comments)
            .where(and(eq(comments.userId, userId), eq(comments.status, 'posted')))
            .orderBy(desc(comments.postedAt))
            .limit(1)

        const minDelaySeconds = Number(env.LINKEDIN_MIN_COMMENT_DELAY_SECONDS ?? 30)

        if (lastComment?.postedAt) {
            const elapsed = (Date.now() - new Date(lastComment.postedAt).getTime()) / 1000
            const remaining = minDelaySeconds - elapsed
            if (remaining > 0) {
                return apiError(
                    `Aguarde ${Math.ceil(remaining)}s antes de comentar novamente`,
                    429,
                    'COMMENT_DELAY',
                )
            }
        }

        // Busca o post no banco para obter o profile_id
        const [dbPost] = await db
            .select({ id: posts.id, profileId: posts.profileId })
            .from(posts)
            .where(and(eq(posts.linkedinPostId, linkedinPostId), eq(posts.userId, userId)))
            .limit(1)

        if (!dbPost) return apiError('Post não encontrado no banco local', 404)

        // Cria registro no banco com status 'posting' ANTES de chamar o Unipile
        const [comment] = await db
            .insert(comments)
            .values({
                userId,
                postId: dbPost.id,
                profileId: dbPost.profileId,
                styleId: styleId ?? 'manual',
                text,
                status: 'posting',
            })
            .returning()

        log.info({ userId, linkedinPostId, commentId: comment.id }, 'Publicando comentário')

        // Chama o Unipile para publicar no LinkedIn
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await unipileFetch<any>(`/posts/${encodeURIComponent(linkedinPostId)}/comments`, {
                method: 'POST',
                body: JSON.stringify({
                    account_id: env.UNIPILE_LINKEDIN_ACCOUNT_ID,
                    text,
                }),
            })

            const linkedinCommentId = result?.id ?? result?.comment_id ?? null

            // Atualiza para 'posted' com o ID retornado pelo LinkedIn
            await db
                .update(comments)
                .set({
                    status: 'posted',
                    linkedinCommentId: String(linkedinCommentId ?? ''),
                    postedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(comments.id, comment.id))

            log.info({ commentId: comment.id, linkedinCommentId }, 'Comentário publicado')
            return success({ commentId: comment.id, linkedinCommentId, posted: true })

        } catch (unipileErr) {
            // Falhou no Unipile — atualiza para 'failed'
            await db
                .update(comments)
                .set({
                    status: 'failed',
                    failReason: (unipileErr as Error).message,
                    updatedAt: new Date(),
                })
                .where(eq(comments.id, comment.id))

            log.error({ commentId: comment.id, err: (unipileErr as Error).message }, 'Falha ao publicar')
            throw unipileErr
        }

    } catch (err) {
        return apiError(
            err instanceof Error ? err.message : 'Erro ao publicar comentário',
            500,
            'COMMENT_ERROR'
        )
    }
}
