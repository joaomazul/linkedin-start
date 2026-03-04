import { db } from '@/db'
import { cadenceSuggestions, cadenceSettings } from '@/db/schema/cadence'
import { crmPeople, crmInteractions } from '@/db/schema/crm'
import { abmSignals } from '@/db/schema/signals'
import { monitoredProfiles } from '@/db/schema/profiles'
import { eq, and, sql, desc, lte, or, inArray } from 'drizzle-orm'
import { createLogger } from '@/lib/logger'
import { openrouterChat, OPENROUTER_MODEL } from '@/lib/openrouter/client'

const log = createLogger('cadence/engine')

export async function processCadenceForUser(userId: string) {
    log.info({ userId }, 'Processando cadência para o usuário')

    try {
        // 1. Pegar configurações de cadência
        const [settings] = await db
            .select()
            .from(cadenceSettings)
            .where(eq(cadenceSettings.userId, userId))
            .limit(1)

        if (!settings || !settings.autoSuggestEnabled) {
            log.info({ userId }, 'Autossugestão desativada para este usuário')
            return
        }

        const minDays = settings.minDaysBetweenTouches

        // 2. Buscar pessoas que precisam de interação
        // (Sem interação nos últimos X dias)
        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - minDays)

        const targets = await db
            .select()
            .from(crmPeople)
            .where(and(
                eq(crmPeople.userId, userId),
                or(
                    lte(crmPeople.lastInteractionAt, thresholdDate),
                    sql`${crmPeople.lastInteractionAt} IS NULL`
                )
            ))
            .limit(20)

        // --- Batch-fetch to avoid N+1 queries ---

        const personIds = targets.map(p => p.id)
        const linkedinProfileIds = targets.map(p => p.linkedinProfileId).filter(Boolean) as string[]

        // 2a. Batch: all pending suggestions for these personIds
        const pendingPersonIds = new Set<string>()
        if (personIds.length > 0) {
            const pendingSuggestions = await db
                .select({ personId: cadenceSuggestions.personId })
                .from(cadenceSuggestions)
                .where(and(
                    inArray(cadenceSuggestions.personId, personIds),
                    eq(cadenceSuggestions.status, 'pending')
                ))
            for (const row of pendingSuggestions) {
                pendingPersonIds.add(row.personId)
            }
        }

        // 2b. Batch: all monitored profiles for these linkedinProfileIds
        const profileMap = new Map<string, string>() // linkedinProfileId → monitoredProfile.id
        if (linkedinProfileIds.length > 0) {
            const profiles = await db
                .select({ id: monitoredProfiles.id, linkedinProfileId: monitoredProfiles.linkedinProfileId })
                .from(monitoredProfiles)
                .where(and(
                    eq(monitoredProfiles.userId, userId),
                    inArray(monitoredProfiles.linkedinProfileId, linkedinProfileIds)
                ))
            for (const p of profiles) {
                if (p.linkedinProfileId) {
                    profileMap.set(p.linkedinProfileId, p.id)
                }
            }
        }

        // 2c. Batch: top unprocessed ABM signal per monitoredProfile
        const signalMap = new Map<string, typeof abmSignals.$inferSelect>()
        const monitoredIds = [...profileMap.values()]
        if (monitoredIds.length > 0) {
            const signals = await db
                .select()
                .from(abmSignals)
                .where(and(
                    inArray(abmSignals.profileId, monitoredIds),
                    eq(abmSignals.processedInCadence, false)
                ))
                .orderBy(desc(abmSignals.relevanceScore))
            // Keep only the first (highest score) signal per profileId
            for (const s of signals) {
                if (!signalMap.has(s.profileId)) {
                    signalMap.set(s.profileId, s)
                }
            }
        }

        // --- Process each target using pre-fetched data ---

        for (const person of targets) {
            // Skip if already has a pending suggestion
            if (pendingPersonIds.has(person.id)) continue

            // Resolve signal via profileMap → signalMap
            const monitoredId = person.linkedinProfileId ? profileMap.get(person.linkedinProfileId) : undefined
            const signal = monitoredId ? signalMap.get(monitoredId) : undefined

            // 4. Gerar a sugestão via IA
            const suggestion = await generateAISuggestion(person, signal)

            if (suggestion) {
                await db.insert(cadenceSuggestions).values({
                    userId,
                    personId: person.id,
                    signalId: signal?.id,
                    type: suggestion.type,
                    reason: suggestion.reason,
                    suggestedContent: suggestion.content,
                    urgencyScore: signal?.isBuyingTrigger ? 90 : 50,
                    status: 'pending'
                })

                if (signal) {
                    await db.update(abmSignals).set({ processedInCadence: true }).where(eq(abmSignals.id, signal.id))
                }
            }
        }

    } catch (error: any) {
        log.error({ userId, err: error.message }, 'Erro no motor de cadência')
    }
}

async function generateAISuggestion(person: any, signal?: any) {
    const safeSignalText = (signal?.description ?? signal?.sourceText ?? '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, 500)

    const prompt = `Analise este lead e gere uma sugestão de próximo passo no LinkedIn.
LEAD: ${person.name} (${person.headline})
SINAL RECENTE: ${signal ? `${signal.title}: ${safeSignalText}` : 'Nenhum sinal específico, apenas tempo sem contato.'}

Gere uma sugestão acionável. 
Responda APENAS em JSON:
{
  "type": "follow_up | ice_breaker | celebratory | re_engagement",
  "reason": "Por que interagir agora? (1 frase)",
  "content": "Sugestão de mensagem curta e humana para enviar"
}`

    try {
        const response = await openrouterChat({
            model: OPENROUTER_MODEL,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (content) return JSON.parse(content)
    } catch (err: any) {
        log.error({ err: err.message }, 'Erro na IA de cadência')
    }
    return null
}
