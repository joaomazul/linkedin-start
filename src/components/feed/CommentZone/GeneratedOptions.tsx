"use client";

import { RefreshCw, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GeneratedOptionsProps {
    options: string[]
    onSelect: (option: string) => void
    onRegenerate: () => void
    onCancel: () => void
    isRegenerating: boolean
}

export function GeneratedOptions({
    options,
    onSelect,
    onRegenerate,
    onCancel,
    isRegenerating,
}: GeneratedOptionsProps) {
    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Escolha uma opção
                </p>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onRegenerate}
                        disabled={isRegenerating}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1
                       text-xs text-muted-foreground hover:text-foreground
                       hover:bg-muted/50 transition-colors disabled:opacity-50"
                        title="Gerar novas opções"
                    >
                        <RefreshCw className={cn('h-3 w-3', isRegenerating && 'animate-spin')} />
                        Regenerar
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Opções */}
            <div className="space-y-3">
                {options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(option)}
                        className="w-full text-left rounded-xl border border-edge bg-white
                       p-4 text-sm leading-relaxed shadow-sm
                       hover:border-primary/50 hover:bg-primary/[0.02]
                       transition-all group flex items-start gap-3 active:scale-[0.99]"
                    >
                        <span className="flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center
                             rounded-full border border-edge text-[10px] font-bold text-ink-4
                             group-hover:border-primary group-hover:text-primary group-hover:bg-primary/5 transition-all">
                            {idx + 1}
                        </span>
                        <span className="flex-1 text-ink leading-relaxed">{option}</span>
                        <ChevronRight className="flex-shrink-0 h-4 w-4 text-ink-4
                                      opacity-0 group-hover:opacity-100
                                      group-hover:text-primary transition-all translate-x-1" />
                    </button>
                ))}
            </div>
        </div>
    )
}
