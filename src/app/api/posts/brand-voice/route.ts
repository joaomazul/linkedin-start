import { db } from '@/db'
import { brandVoiceCache } from '@/db/schema/posts'
import { eq } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()

        const [voice] = await db
            .select()
            .from(brandVoiceCache)
            .where(eq(brandVoiceCache.userId, userId))
            .limit(1)

        return success({
            hasVoice: !!voice?.writingStyle,
            postsAnalyzed: voice?.postsAnalyzed ?? 0,
            lastAnalyzedAt: voice?.lastAnalyzedAt ?? null,
            toneAdjectives: voice?.toneAdjectives ?? [],
            recurringTopics: voice?.recurringTopics ?? [],
            writingStyle: voice?.writingStyle ?? null,
        })
    } catch (error) {
        return apiError('Erro ao buscar brand voice', 500)
    }
}
