"use client";

import { useRef, useEffect, useCallback } from 'react'
import { Loader2, Send, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_CHARS = 1250

interface ApproveZoneProps {
    value: string
    onChange: (v: string) => void
    onPublish: () => void
    onBack: () => void
    isPublishing: boolean
}

export function ApproveZone({
    value,
    onChange,
    onPublish,
    onBack,
    isPublishing,
}: ApproveZoneProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const remaining = MAX_CHARS - value.length
    const isOverLimit = remaining < 0
    const isNearLimit = remaining < 100 && !isOverLimit

    // Auto-resize do textarea
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
    }, [value])

    // Foca o textarea ao montar
    useEffect(() => { textareaRef.current?.focus() }, [])

    // Atalho Ctrl+Enter para publicar
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            if (!isOverLimit && value.trim() && !isPublishing) onPublish()
        }
    }, [isOverLimit, value, isPublishing, onPublish])

    return (
        <div className="space-y-2">
            {/* Textarea */}
            <div className={cn(
                'rounded-xl border bg-white p-4 shadow-sm transition-all duration-[var(--t-base)]',
                isOverLimit
                    ? 'border-destructive ring-4 ring-destructive/5'
                    : 'border-edge focus-within:border-ink focus-within:ring-4 focus-within:ring-brand/5'
            )}>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva ou edite seu comentário..."
                    disabled={isPublishing}
                    rows={3}
                    className="w-full resize-none bg-transparent text-sm text-foreground
                     placeholder:text-muted-foreground focus:outline-none
                     disabled:opacity-60 min-h-[72px]"
                />
            </div>

            {/* Footer: contador + botões */}
            <div className="flex items-center justify-between gap-2">
                {/* Contador de caracteres */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onBack}
                        disabled={isPublishing}
                        className="flex items-center gap-2 text-xs font-bold text-ink-4
                       hover:text-primary transition-all disabled:opacity-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </button>

                    <span className={cn(
                        'text-xs tabular-nums transition-colors',
                        isOverLimit ? 'text-destructive font-medium' :
                            isNearLimit ? 'text-amber-500' :
                                'text-muted-foreground'
                    )}>
                        {remaining < 0 ? `+${Math.abs(remaining)}` : remaining} caracteres
                    </span>
                </div>

                {/* Botão publicar */}
                <button
                    onClick={onPublish}
                    disabled={isOverLimit || !value.trim() || isPublishing}
                    className={cn(
                        'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-md',
                        'transition-all active:scale-[0.98]',
                        isOverLimit || !value.trim()
                            ? 'opacity-40 cursor-not-allowed bg-page text-ink-4 border border-edge'
                            : 'bg-lime text-ink hover:bg-lime/90'
                    )}
                >
                    {isPublishing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Publicando...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4" />
                            Publicar no LinkedIn
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
