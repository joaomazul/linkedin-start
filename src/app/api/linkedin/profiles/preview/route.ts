import { getAuthenticatedUserId } from '@/lib/auth/user'
import { resolveProfileByUrl } from '@/lib/unipile/profiles'
import { extractPublicIdentifier } from '@/lib/unipile/profiles'
import { success, apiError } from '@/lib/utils/api-response'
import { createLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const log = createLogger('api/profiles/preview')

export async function GET(req: Request) {
    try {
        await getAuthenticatedUserId()

        const { searchParams } = new URL(req.url)
        const linkedinUrl = searchParams.get('url')?.trim()

        if (!linkedinUrl) {
            return apiError('URL obrigatória', 400, 'MISSING_URL')
        }

        // Valida formato básico antes de chamar a Unipile
        const publicId = extractPublicIdentifier(linkedinUrl)
        if (!publicId) {
            return apiError(
                'URL inválida. Use: linkedin.com/in/nome-do-perfil',
                400,
                'INVALID_URL'
            )
        }

        log.info({ publicId }, 'Preview de perfil')

        // Chama Unipile e retorna os dados do perfil
        const profile = await resolveProfileByUrl(linkedinUrl)

        return success({
            providerId: profile.providerId,
            publicIdentifier: profile.publicIdentifier,
            name: profile.name,
            headline: profile.headline,
            avatarUrl: profile.avatarUrl,
            followerCount: profile.followerCount,
            location: profile.location,
            isOpenProfile: profile.isOpenProfile,
        })

    } catch (err) {
        const message = (err as Error).message

        // Erros específicos com mensagens amigáveis
        if (message.includes('não encontrado') || message.includes('not found')) {
            return apiError(
                'Perfil não encontrado. Verifique a URL e tente novamente.',
                404,
                'PROFILE_NOT_FOUND'
            )
        }
        if (message.includes('privado') || message.includes('private')) {
            return apiError(
                'Este perfil é privado e não pode ser monitorado.',
                403,
                'PRIVATE_PROFILE'
            )
        }

        log.error({ err: message }, 'Erro ao buscar preview')
        return apiError(
            'Não foi possível buscar o perfil. Tente novamente.',
            500,
            'PREVIEW_ERROR'
        )
    }
}
