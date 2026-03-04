import { NextRequest } from 'next/server'
import { db } from '@/db'
import { abmSignals } from '@/db/schema/signals'
import { monitoredProfiles } from '@/db/schema/profiles'
import { eq, desc, and } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { createApiResponse } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return createApiResponse.unauthorized()

        const { searchParams } = new URL(req.url)
        const unreadOnly = searchParams.get('unread') === 'true'

        const filters = [eq(abmSignals.userId, userId)]
        if (unreadOnly) filters.push(eq(abmSignals.isRead, false))

        const signals = await db
            .select({
                signal: abmSignals,
                profileName: monitoredProfiles.name,
                profileAvatar: monitoredProfiles.avatarUrl,
                profileHeadline: monitoredProfiles.headline
            })
            .from(abmSignals)
            .innerJoin(monitoredProfiles, eq(abmSignals.profileId, monitoredProfiles.id))
            .where(and(...filters))
            .orderBy(desc(abmSignals.occurredAt))
            .limit(50)

        return createApiResponse.success({ signals })

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}
