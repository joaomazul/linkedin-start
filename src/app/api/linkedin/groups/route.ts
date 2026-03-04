import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { profileGroups } from '@/db/schema/groups'
import { eq, asc } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const log = createLogger('api/groups')

const GroupSchema = z.object({
    name: z.string().min(1, 'Nome do grupo é obrigatório').max(255),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()

        const groups = await db
            .select()
            .from(profileGroups)
            .where(eq(profileGroups.userId, userId))
            .orderBy(asc(profileGroups.name))

        return success(groups)
    } catch (err) {
        log.error({ err: (err as Error).message }, 'Erro ao listar grupos')
        return apiError('Erro ao buscar grupos', 500)
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const body = await req.json()
        const parsed = GroupSchema.safeParse(body)

        if (!parsed.success) {
            return apiError(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400)
        }

        const [newGroup] = await db
            .insert(profileGroups)
            .values({
                userId,
                name: parsed.data.name,
                color: parsed.data.color ?? '#64748b', // Default slate
            })
            .returning()

        log.info({ groupId: newGroup.id, name: newGroup.name }, 'Grupo criado')
        return success(newGroup, 201)
    } catch (err) {
        log.error({ err: (err as Error).message }, 'Erro ao criar grupo')
        return apiError('Erro ao criar grupo', 500)
    }
}
