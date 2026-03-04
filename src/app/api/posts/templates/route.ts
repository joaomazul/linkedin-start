import { db } from '@/db'
import { postTemplates } from '@/db/schema/posts'
import { eq, or, isNull } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()

        // Busca templates do sistema + templates do usuário
        const templates = await db.select()
            .from(postTemplates)
            .where(
                or(
                    isNull(postTemplates.userId),
                    eq(postTemplates.userId, userId)
                )
            )
            .orderBy(postTemplates.sortOrder)

        return success(templates)
    } catch (error) {
        return apiError('Erro ao buscar templates', 500)
    }
}
