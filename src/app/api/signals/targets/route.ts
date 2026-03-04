import { NextRequest } from 'next/server'
import { db } from '@/db'
import { abmTargets } from '@/db/schema/signals'
import { monitoredProfiles } from '@/db/schema/profiles'
import { eq, desc, and } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { createApiResponse } from '@/lib/api-response'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return createApiResponse.unauthorized()

        const { searchParams } = new URL(req.url)
        const activeOnly = searchParams.get('active') !== 'false'

        const filters = [eq(abmTargets.userId, userId)]
        if (activeOnly) filters.push(eq(abmTargets.isActive, true))

        const targets = await db
            .select({
                target: abmTargets,
                profileName: monitoredProfiles.name,
                profileAvatar: monitoredProfiles.avatarUrl,
                profileHeadline: monitoredProfiles.headline,
                profileUrl: monitoredProfiles.linkedinUrl,
            })
            .from(abmTargets)
            .innerJoin(monitoredProfiles, eq(abmTargets.profileId, monitoredProfiles.id))
            .where(and(...filters))
            .orderBy(desc(abmTargets.createdAt))

        return createApiResponse.success({ targets })

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}

const CreateTargetSchema = z.object({
    profileId: z.string().uuid(),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    notes: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return createApiResponse.unauthorized()

        const body = await req.json()
        const parsed = CreateTargetSchema.safeParse(body)
        if (!parsed.success) return createApiResponse.badRequest('Dados inválidos')

        // Verificar que o perfil pertence ao usuário
        const [profile] = await db
            .select({ id: monitoredProfiles.id })
            .from(monitoredProfiles)
            .where(and(
                eq(monitoredProfiles.id, parsed.data.profileId),
                eq(monitoredProfiles.userId, userId)
            ))
            .limit(1)

        if (!profile) return createApiResponse.notFound('Perfil não encontrado')

        const [target] = await db
            .insert(abmTargets)
            .values({
                userId,
                profileId: parsed.data.profileId,
                priority: parsed.data.priority,
                notes: parsed.data.notes,
            })
            .returning()

        return createApiResponse.success(target)

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}
