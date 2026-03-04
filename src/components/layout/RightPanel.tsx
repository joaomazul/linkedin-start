"use client";

import React from 'react'
import { useHistoryStore } from '@/store/history.store'
import { formatRelativeTime } from '@/lib/utils/format'
import { CommentHistoryEntry } from '@/types/linkedin.types'
import { Clock } from 'lucide-react'

export function RightPanel() {
    const entries = useHistoryStore((s) => s.entries)
    const sortedHistory = [...entries].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return (
        <aside className="hidden lg:flex w-[248px] h-full flex-col border-l border-edge bg-white shrink-0 overflow-hidden">
            <div className="h-[52px] px-5 flex items-center gap-2 border-b border-edge shrink-0">
                <h2 className="text-[12px] font-bold uppercase tracking-[1px] text-ink-4">
                    Histórico
                </h2>
                <span className="text-[11px] font-semibold text-ink-4">
                    ({entries.length})
                </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                <div className="flex flex-col">
                    {sortedHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-page">
                                <Clock className="h-5 w-5 text-ink-4" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-[12px] font-semibold text-ink-3">Seus comentários</p>
                                <p className="text-[11px] text-ink-4">aparecem aqui</p>
                            </div>
                        </div>
                    ) : (
                        sortedHistory.map((item) => (
                            <HistoryItem key={item.id} item={item} />
                        ))
                    )}
                </div>
            </div>
        </aside>
    )
}

function HistoryItem({ item }: { item: CommentHistoryEntry }) {
    const initials = item.authorName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    return (
        <div className="group p-[11px_12px] border border-edge rounded-[var(--r-md)] bg-white mb-2 transition-all duration-[var(--t-fast)] hover:shadow-sm hover:bg-hover cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                        backgroundColor: `${item.authorColor || '#5b6ef5'}26`,
                        color: item.authorColor || '#5b6ef5'
                    }}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="truncate text-[11px] font-semibold text-brand">
                        {item.authorName}
                    </p>
                </div>
                <span className="text-[10px] text-ink-4 flex-shrink-0">
                    {formatRelativeTime(item.timestamp)}
                </span>
            </div>

            <p className="line-clamp-2 text-[11px] text-ink-3 italic leading-relaxed">
                {item.text}
            </p>

            <div className="mt-[6px] inline-flex items-center gap-1 p-[2px_7px] bg-page border border-edge rounded-full">
                <span className="text-[10px]">
                    {getStyleIcon(item.styleId)}
                </span>
                <span className="text-[10px] font-medium text-ink-4">
                    {item.styleId.replace('_', ' ')}
                </span>
            </div>
        </div>
    )
}

function getStyleIcon(styleId: string) {
    const icons: Record<string, string> = {
        positivo: '👍',
        valor: '💡',
        pergunta: '❓',
        sugestao: '🔧',
        relato: '📖',
        discordancia_respeitosa: '🤝',
        parabenizacao: '🎉',
    }
    return icons[styleId] || '💬'
}
