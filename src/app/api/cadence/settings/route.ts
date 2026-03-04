import { NextRequest } from 'next/server'
import { db } from '@/db'
import { cadenceSettings } from '@/db/schema/cadence'
import { eq } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { createApiResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return createApiResponse.unauthorized()

        let [settings] = await db
            .select()
            .from(cadenceSettings)
            .where(eq(cadenceSettings.userId, userId))
            .limit(1)

        // Cria configurações padrão se não existirem
        if (!settings) {
            const [created] = await db
                .insert(cadenceSettings)
                .values({ userId })
                .returning()
            settings = created
        }

        return createApiResponse.success(settings)

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return createApiResponse.unauthorized()

        const body = await req.json()
        const allowed = ['minDaysBetweenTouches', 'autoSuggestEnabled', 'prioritizeBuyingSignals']
        const updates: Record<string, unknown> = {}
        for (const key of allowed) {
            if (key in body) updates[key] = body[key]
        }

        if (Object.keys(updates).length === 0) {
            return createApiResponse.badRequest('Nenhum campo válido para atualizar')
        }

        await db
            .insert(cadenceSettings)
            .values({ userId, ...updates })
            .onConflictDoUpdate({
                target: cadenceSettings.userId,
                set: { ...updates, updatedAt: new Date() }
            })

        const [settings] = await db
            .select()
            .from(cadenceSettings)
            .where(eq(cadenceSettings.userId, userId))
            .limit(1)

        return createApiResponse.success(settings)

    } catch (error: any) {
        return createApiResponse.error(error.message)
    }
}
