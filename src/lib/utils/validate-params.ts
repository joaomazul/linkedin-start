import { z } from 'zod'
import { apiError } from '@/lib/utils/api-response'

const uuidSchema = z.string().uuid()

export function validateUUID(id: string) {
    const result = uuidSchema.safeParse(id)
    if (!result.success) {
        return { valid: false as const, error: apiError('ID inválido', 400) }
    }
    return { valid: true as const, id: result.data }
}
