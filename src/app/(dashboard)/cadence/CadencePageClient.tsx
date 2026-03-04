"use client";

import { useState } from 'react'
import { CadenceQueue } from '@/components/cadence/cadence-queue'
import { ListChecks, CheckCircle, Clock, XCircle, ArrowRight, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

interface CadencePageClientProps {
    initialSuggestions: any[]
    stats: { pending: number; done: number; dismissed: number }
}

export default function CadencePageClient({ initialSuggestions, stats }: CadencePageClientProps) {
    const [filter, setFilter] = useState<string>('pending')

    const filtered = initialSuggestions.filter(s => {
        if (filter === 'all') return true
        return s.suggestion.status === filter
    })

    const total = stats.pending + stats.done + stats.dismissed

    const filters = [
        { key: 'pending', label: 'Pendentes', count: stats.pending },
        { key: 'done', label: 'Concluídas', count: stats.done },
        { key: 'dismissed', label: 'Ignoradas', count: stats.dismissed },
    ]

    return (
        <div className="flex flex-col gap-6 py-6">
            <PageHeader title="⚙️ Cadência Inteligente" subtitle="Próximos passos sugeridos pela IA para seus contatos.">
                <Link href="/settings" className="h-9 w-9 rounded-[10px] bg-page text-ink-3 hover:bg-ink hover:text-white flex items-center justify-center transition-all" title="Configurações">
                    <Settings size={17} strokeWidth={1.8} />
                </Link>
            </PageHeader>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard variant="default" label="Total Sugestões" value={total} icon={<ListChecks size={16} />} />
                <MetricCard variant="dark" label="Pendentes" value={stats.pending} icon={<Clock size={16} />} />
                <MetricCard variant="lime" label="Concluídas" value={stats.done} icon={<CheckCircle size={16} />} />
                <MetricCard variant="default" label="Ignoradas" value={stats.dismissed} icon={<XCircle size={16} />} />
            </div>

            <div className="flex gap-[2px] p-[3px] bg-page rounded-full w-fit">
                {filters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={cn(
                            'px-4 py-[7px] rounded-full text-[12px] font-semibold transition-all flex items-center gap-1.5',
                            filter === f.key
                                ? 'bg-white text-ink shadow-sm'
                                : 'text-ink-3 hover:text-ink'
                        )}
                    >
                        {f.label}
                        <span className={cn(
                            "text-[10px] px-1.5 rounded-full font-bold",
                            filter === f.key ? "bg-lime text-ink" : "bg-page text-ink-4"
                        )}>{f.count}</span>
                    </button>
                ))}
            </div>

            {total === 0 ? (
                <div className="flex flex-col items-center justify-center p-14 text-center gap-3 border-2 border-dashed border-edge rounded-[var(--r-xl)]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] bg-page mb-1">
                        <ListChecks className="h-6 w-6 text-ink-4" />
                    </div>
                    <h3 className="text-[16px] font-bold text-ink">Nenhuma sugestão de cadência</h3>
                    <p className="text-[13px] text-ink-4 max-w-[320px] leading-[1.65]">
                        A cadência analisa seus contatos no CRM e sugere ações de follow-up automaticamente.
                    </p>
                    <div className="flex gap-3 mt-2">
                        <Link href="/crm" className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-white rounded-full text-[13px] font-bold hover:bg-brand transition-all">
                            Ver CRM <ArrowRight size={14} />
                        </Link>
                        <Link href="/signals" className="inline-flex items-center gap-2 px-5 py-2.5 bg-page text-ink-3 rounded-full text-[13px] font-bold hover:bg-ink hover:text-white transition-all">
                            Ver Sinais ABM
                        </Link>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-ink-4 text-[13px]">
                    Nenhuma sugestão com o filtro selecionado.
                </div>
            ) : (
                <CadenceQueue initialSuggestions={filtered} />
            )}
        </div>
    )
}
