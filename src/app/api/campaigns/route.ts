import { getAuthenticatedUserId } from '@/lib/auth/user'
import { db } from '@/db'
import { campaigns, appSettings } from '@/db/schema'
import { desc, eq, and, sql } from 'drizzle-orm'
import { success, apiError } from '@/lib/utils/api-response'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import { resolvePostFromUrl } from '@/lib/campaigns/resolve-post'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const log = createLogger('api/campaigns')

const createSchema = z.object({
    name: z.string().min(3).max(100),
    postUrl: z.string().url(),
    captureMode: z.enum(['any', 'keyword']),
    keywords: z.array(z.string()).optional(),
    actionLike: z.boolean().default(true),
    actionReply: z.boolean().default(false),
    actionDm: z.boolean().default(true),
    actionInvite: z.boolean().default(false),
    leadMagnetUrl: z.string().url().optional().nullable(),
    leadMagnetLabel: z.string().max(50).optional(),
    replyTemplate: z.string().max(1000).optional().nullable(),
    dmTemplate: z.string().max(2000).optional().nullable(),
    requireApproval: z.boolean().default(true),
    windowDays: z.number().int().min(1).max(30).default(7)
})

// ── GET /api/campaigns ──────────────────────────────────────────────────────
export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()

        const list = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.userId, userId))
            .orderBy(desc(campaigns.createdAt))

        return success(list)
    } catch (err: any) {
        log.error({ err: err.message }, 'Erro ao listar campanhas')
        return apiError('Falha ao buscar campanhas', 500)
    }
}

// ── POST /api/campaigns ─────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const body = await req.json()
        const parsed = createSchema.safeParse(body)

        if (!parsed.success) {
            return apiError('Dados inválidos', 400, 'INVALID_INPUT')
        }

        // Pegar conta ativa do usuário
        const [settings] = await db
            .select()
            .from(appSettings)
            .where(eq(appSettings.userId, userId))
            .limit(1)

        const accountId = settings?.activeLinkedinAccountId
        if (!accountId) {
            return apiError('Conecte sua conta LinkedIn primeiro', 400)
        }

        // Limites de segurança (G2 do plano original)
        const [activeCount] = await db
            .select({ count: sql`count(*)` })
            .from(campaigns)
            .where(and(eq(campaigns.userId, userId), eq(campaigns.status, 'active')))

        const MAX_ACTIVE = Number(process.env.CAMPAIGN_MAX_ACTIVE_PER_USER || 3)
        if (Number((activeCount as any).count) >= MAX_ACTIVE) {
            return apiError(`Você atingiu o limite de ${MAX_ACTIVE} campanhas ativas. Encerre uma para criar outra.`, 403)
        }

        // Resolver post para pegar metadados iniciais
        log.info({ postUrl: parsed.data.postUrl }, 'Resolvendo post para nova campanha')
        const resolved = await resolvePostFromUrl(parsed.data.postUrl, accountId)

        // Criar a campanha
        const [newCampaign] = await db.insert(campaigns).values({
            userId,
            name: parsed.data.name,
            status: 'active',
            postUrl: parsed.data.postUrl,
            linkedinPostId: resolved.linkedinPostId,
            postTextSnapshot: resolved.postText,
            postAuthorName: resolved.authorName,
            postAuthorId: resolved.authorId,
            captureMode: parsed.data.captureMode,
            keywords: parsed.data.keywords || [],
            actionLike: parsed.data.actionLike,
            actionReply: parsed.data.actionReply,
            actionDm: parsed.data.actionDm,
            actionInvite: parsed.data.actionInvite,
            leadMagnetUrl: parsed.data.leadMagnetUrl,
            leadMagnetLabel: parsed.data.leadMagnetLabel || 'Acesse aqui',
            replyTemplate: parsed.data.replyTemplate,
            dmTemplate: parsed.data.dmTemplate,
            requireApproval: parsed.data.requireApproval,
            windowDays: parsed.data.windowDays,
            expiresAt: new Date(Date.now() + parsed.data.windowDays * 24 * 60 * 60 * 1000)
        }).returning()

        return success(newCampaign, 201)

    } catch (err: any) {
        log.error({ err: err.message }, 'Erro ao criar campanha')
        return apiError(err.message || 'Falha ao criar campanha', 500)
    }
}
