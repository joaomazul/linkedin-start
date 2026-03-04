import { NextResponse } from 'next/server'

export interface ApiSuccess<T> {
    ok: true
    data: T
}

export interface ApiError {
    ok: false
    error: {
        message: string
        code?: string
        status: number
    }
}

/**
 * Use directly as `return success(data)` — do NOT wrap in NextResponse.json().
 */
export function success<T>(data: T, status = 200) {
    return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, { status })
}

/**
 * Use directly as `return apiError(...)` — do NOT wrap in NextResponse.json().
 */
export function apiError(
    message: string,
    status = 500,
    code?: string
) {
    return NextResponse.json<ApiError>(
        { ok: false, error: { message, code, status } },
        { status }
    )
}

// Use este tipo no frontend para tipar as respostas
export type ApiResponse<T> = ApiSuccess<T> | ApiError

// Atalhos convenientes para respostas padronizadas
export const createApiResponse = {
    success,
    error: apiError,
    unauthorized: () => apiError('Não autorizado', 401, 'UNAUTHORIZED'),
    forbidden: () => apiError('Acesso negado', 403, 'FORBIDDEN'),
    notFound: (msg = 'Não encontrado') => apiError(msg, 404, 'NOT_FOUND'),
    badRequest: (msg = 'Requisição inválida') => apiError(msg, 400, 'BAD_REQUEST'),
}
