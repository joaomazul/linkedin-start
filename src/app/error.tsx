"use client";

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[GlobalError]', error)
    }, [error])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-page">
            <div className="max-w-md text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-r-sm flex items-center justify-center mx-auto">
                    <AlertTriangle className="text-red-500" size={32} />
                </div>
                <div>
                    <h2 className="text-[15px] font-bold text-ink text-2xl">Algo deu errado!</h2>
                    <p className="t-body text-ink-3 mt-2">
                        Ocorreu um erro inesperado ao processar sua solicitação no sistema.
                    </p>
                </div>
                <div className="grid gap-3">
                    <Button onClick={() => reset()} className="w-full bg-brand hover:bg-brand-dark">
                        Tentar Novamente
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            localStorage.clear()
                            window.location.href = '/'
                        }}
                        className="w-full border-edge text-ink-3 hover:bg-white"
                    >
                        Limpeza Profunda (Hard Reset)
                    </Button>
                </div>
            </div>
        </div>
    )
}
