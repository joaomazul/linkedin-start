import { db } from '@/db'
import { personas } from '@/db/schema/personas'
import { commentStyles } from '@/db/schema/comment-styles'
import { monitoredProfiles } from '@/db/schema/profiles'
import { getAuthenticatedUserId } from '@/lib/auth/user'
import { success, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        const body = await req.json()
        const { profiles: localProfiles = [], settings = {} } = body

        logger.info({ userId, profilesCount: localProfiles.length }, '[MIGRATION API] Recebendo dados locais')

        // 1. IMPORTAR PERFIS
        for (const lp of localProfiles) {
            if (!lp.id || !lp.name) continue

            // Verifica se perfil já existe para este user
            const [exists] = await db.select({ id: monitoredProfiles.id }).from(monitoredProfiles).where(and(eq(monitoredProfiles.userId, userId), eq(monitoredProfiles.linkedinId, lp.id)))

            if (!exists) {
                await db.insert(monitoredProfiles).values({
                    userId,
                    linkedinId: lp.id,
                    linkedinUrl: lp.url || '',
                    name: lp.name,
                    role: lp.role || '',
                    initials: lp.initials || '',
                    color: lp.color || '#5b6ef5',
                    active: lp.active ?? true,
                    displayOrder: lp.order || 0
                })
            }
        }

        // 2. IMPORTAR PERSONA
        if (settings.persona) {
            const [existingPersona] = await db.select({ id: personas.id }).from(personas).where(eq(personas.userId, userId))
            if (existingPersona) {
                await db.update(personas).set({ name: settings.persona.name || 'Persona Importada', customPrompt: settings.persona.prompt || '' }).where(eq(personas.id, existingPersona.id))
            } else {
                await db.insert(personas).values({ userId, name: settings.persona.name || 'Persona Importada', customPrompt: settings.persona.prompt || '', isActive: 'true' })
            }
        }

        // 3. (OPCIONAL) Estilos customizados
        if (settings.customStyles && Array.isArray(settings.customStyles)) {
            for (const cs of settings.customStyles) {
                const uniqueKey = `custom_${cs.id || Date.now()}`
                // Verifica duplicidade pela constraint cs_user_style_unique ignorando erros na inserção
                await db.insert(commentStyles).values({
                    userId,
                    styleKey: uniqueKey,
                    label: cs.label || 'Estilo Extra',
                    icon: cs.icon || '💬',
                    description: cs.description || '',
                    prompt: cs.prompt || '',
                    isCustom: true,
                    active: true,
                    displayOrder: 99
                }).onConflictDoNothing()
            }
        }

        // Nota: Ignorando history porque o Sync do Unipile / posts já resolve o histórico persistente
        // mas dá pra importar se necessário.

        return success({ migrated: true })
    } catch (err: unknown) {
        logger.error({ err }, '[MIGRATION API] Falhou')
        return apiError('Erro na migração interna', 500)
    }
}
