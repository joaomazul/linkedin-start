"use client";

import { useState } from 'react'
import { SignalFeed } from '@/components/signals/signal-feed'
import { Zap, Bell, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

interface SignalsPageClientProps {
    initialSignals: any[]
    stats: {
        total: number
        buyingTriggers: number
        highRelevance: number
        types: string[]
    }
}

export default function SignalsPageClient({ initialSignals, stats }: SignalsPageClientProps) {
    const [typeFilter, setTypeFilter] = useState<string>('all')

    const filtered = typeFilter === 'all'
        ? initialSignals
        : initialSignals.filter(s => s.signal.type === typeFilter)

    const uniqueTypes = [...new Set(initialSignals.map(s => s.signal.type))]

    return (
        <div className="flex flex-col gap-6 py-6">
            <PageHeader title="⚡ ABM Signal Engine" subtitle="Sinais detectados nos perfis que você monitora." />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard variant="default" label="Total Sinais" value={stats.total} icon={<Zap size={16} />} />
                <MetricCard variant="dark" label="Gatilhos de Compra" value={stats.buyingTriggers} icon={<AlertCircle size={16} />} />
                <MetricCard variant="lime" label="Alta Relevância" value={stats.highRelevance} icon={<TrendingUp size={16} />} />
                <MetricCard variant="default" label="Tipos Detectados" value={uniqueTypes.length} icon={<Bell size={16} />} />
            </div>

            {initialSignals.length > 0 && uniqueTypes.length > 1 && (
                <div className="flex gap-[2px] p-[3px] bg-page rounded-full w-fit flex-wrap">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={cn(
                            'px-4 py-[7px] rounded-full text-[12px] font-semibold transition-all',
                            typeFilter === 'all'
                                ? 'bg-white text-ink shadow-sm'
                                : 'text-ink-3 hover:text-ink'
                        )}
                    >
                        Todos
                    </button>
                    {uniqueTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={cn(
                                'px-4 py-[7px] rounded-full text-[12px] font-semibold transition-all capitalize',
                                typeFilter === type
                                    ? 'bg-white text-ink shadow-sm'
                                    : 'text-ink-3 hover:text-ink'
                            )}
                        >
                            {type.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            )}

            {initialSignals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-14 text-center gap-3 border-2 border-dashed border-edge rounded-[var(--r-xl)]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] bg-page mb-1">
                        <Zap className="h-6 w-6 text-ink-4" />
                    </div>
                    <h3 className="text-[16px] font-bold text-ink">Nenhum sinal detectado</h3>
                    <p className="text-[13px] text-ink-4 max-w-[320px] leading-[1.65]">
                        O ABM Signal Engine monitora seus perfis e detecta gatilhos de compra, mudanças de cargo
                        e outros sinais relevantes automaticamente.
                    </p>
                    <Link
                        href="/feed"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-white rounded-full text-[13px] font-bold hover:bg-brand transition-all mt-2"
                    >
                        Gerenciar Perfis <ArrowRight size={14} />
                    </Link>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-ink-4 text-[13px]">
                    Nenhum sinal com o filtro selecionado.
                </div>
            ) : (
                <SignalFeed initialSignals={filtered} />
            )}
        </div>
    )
}
