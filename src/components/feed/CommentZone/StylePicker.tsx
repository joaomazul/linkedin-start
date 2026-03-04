"use client";

import { useQuery } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'

interface Style {
    id: string
    label: string
    emoji: string
    prompt: string
    active: boolean
}

interface StylePickerProps {
    onSelect: (styleId: string) => void
    onCancel: () => void
}

export function StylePicker({ onSelect, onCancel }: StylePickerProps) {
    const { data: response, isLoading, error } = useQuery({
        queryKey: ['comment-styles'],
        queryFn: () => fetch('/api/settings/styles').then(r => r.json()),
        staleTime: 5 * 60 * 1000,
    })

    const styles: Style[] = (response?.data ?? []).filter((s: Style) => s.active)

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Escolha um estilo
                </p>
                <button
                    onClick={onCancel}
                    className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Carregando estilos...</span>
                </div>
            )}

            {/* Erro */}
            {error && (
                <p className="text-sm text-destructive">
                    Erro ao carregar estilos. Recarregue a página.
                </p>
            )}

            {/* Grid de estilos */}
            {!isLoading && !error && (
                <div className="grid grid-cols-2 gap-2">
                    {styles.map(style => (
                        <button
                            key={style.id}
                            onClick={() => onSelect(style.id)}
                            className="flex items-center gap-3 rounded-xl border border-edge
                         bg-white px-4 py-3 text-left text-sm
                         hover:border-primary hover:bg-primary/[0.02]
                         transition-all group shadow-sm active:scale-[0.98]"
                        >
                            <span className="text-xl leading-none flex-shrink-0 opacity-90 group-hover:opacity-100">
                                {style.emoji}
                            </span>
                            <span className="font-bold text-ink group-hover:text-primary transition-colors">
                                {style.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Vazio */}
            {!isLoading && !error && styles.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                    Nenhum estilo ativo. Configure em{' '}
                    <a href="/settings/prompts" className="text-accent underline">
                        Prompts
                    </a>
                    .
                </p>
            )}
        </div>
    )
}
