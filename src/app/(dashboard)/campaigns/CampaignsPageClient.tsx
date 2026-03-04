"use client";

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { Plus, Target, Users, Zap, ExternalLink, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Campaign {
    id: string
    name: string
    status: string
    postUrl: string
    totalCaptured: number
    totalApproved: number
    totalCompleted: number
    createdAt: string
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')

    useEffect(() => {
        fetch('/api/campaigns')
            .then(res => res.json())
            .then(data => {
                setCampaigns(data.data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter)

    const totalLeads = campaigns.reduce((s, c) => s + c.totalCaptured, 0)
    const totalCompleted = campaigns.reduce((s, c) => s + c.totalCompleted, 0)
    const conversionRate = totalLeads > 0 ? Math.round((totalCompleted / totalLeads) * 100) : 0

    const filters = [
        { key: 'all', label: 'Todas' },
        { key: 'active', label: 'Ativas' },
        { key: 'paused', label: 'Pausadas' },
        { key: 'completed', label: 'Finalizadas' },
    ]

    return (
        <div className="flex flex-col gap-6 py-6">
            <PageHeader title="Campanhas" subtitle="Monitore posts e automatize seu social selling">
                <Button asChild variant="accent" className="gap-2">
                    <Link href="/campaigns/new">
                        <Plus size={14} />
                        Nova Campanha
                    </Link>
                </Button>
            </PageHeader>

            {campaigns.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard variant="default" label="Campanhas" value={campaigns.length} icon={<Target size={16} />} />
                    <MetricCard variant="dark" label="Leads Capturados" value={totalLeads} icon={<Users size={16} />} />
                    <MetricCard variant="lime" label="Concluídos" value={totalCompleted} icon={<Zap size={16} />} />
                    <MetricCard variant="default" label="Conversão" value={`${conversionRate}%`} icon={<Target size={16} />} />
                </div>
            )}

            {campaigns.length > 0 && (
                <div className="flex gap-[2px] p-[3px] bg-page rounded-full w-fit">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={cn(
                                'px-4 py-[7px] rounded-full text-[12px] font-semibold transition-all',
                                filter === f.key
                                    ? 'bg-white text-ink shadow-sm'
                                    : 'text-ink-3 hover:text-ink'
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                </div>
            ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-14 text-center gap-3 border-2 border-dashed border-edge rounded-[var(--r-xl)]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] bg-page mb-1">
                        <Target className="h-6 w-6 text-ink-4" />
                    </div>
                    <h3 className="text-[16px] font-bold text-ink">Nenhuma campanha ativa</h3>
                    <p className="text-[13px] text-ink-4 max-w-[320px] leading-[1.65]">
                        Crie sua primeira campanha de Lead Magnet para começar a capturar leads automaticamente de seus posts.
                    </p>
                    <Button asChild variant="accent" className="mt-2 gap-2">
                        <Link href="/campaigns/new">Começar agora</Link>
                    </Button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-ink-4 text-[13px]">
                    Nenhuma campanha com o filtro selecionado.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(campaign => (
                        <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                </div>
            )}
        </div>
    )
}


function CampaignCard({ campaign }: { campaign: Campaign }) {
    const statusMap: Record<string, { variant: 'success' | 'warn' | 'grey' | 'blue'; label: string }> = {
        active: { variant: 'success', label: 'Ativa' },
        paused: { variant: 'warn', label: 'Pausada' },
        draft: { variant: 'grey', label: 'Rascunho' },
        completed: { variant: 'blue', label: 'Finalizada' },
    }

    const status = statusMap[campaign.status] || statusMap.draft

    return (
        <div className="bg-white border border-edge rounded-[var(--r-xl)] p-5 hover:shadow-md transition-all duration-[var(--t-base)] hover:-translate-y-[2px] group flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div>
                    <Badge variant={status.variant} dot className="mb-2 text-[10px] font-bold uppercase tracking-wider">
                        {status.label}
                    </Badge>
                    <h3 className="text-[15px] font-bold text-ink leading-tight group-hover:text-brand transition-colors">
                        {campaign.name}
                    </h3>
                </div>
                <button className="h-7 w-7 rounded-[var(--r-sm)] bg-page text-ink-4 hover:bg-ink hover:text-white flex items-center justify-center transition-all">
                    <MoreVertical size={14} />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-page rounded-[var(--r-md)] p-3">
                <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-ink-4 uppercase">Leads</span>
                    <span className="text-lg font-extrabold tracking-tight text-ink">{campaign.totalCaptured}</span>
                </div>
                <div className="flex flex-col border-x border-edge/50 px-3">
                    <span className="text-[10px] font-semibold text-ink-4 uppercase">Aceitos</span>
                    <span className="text-lg font-extrabold tracking-tight text-success-text">{campaign.totalApproved}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-ink-4 uppercase">Feitos</span>
                    <span className="text-lg font-extrabold tracking-tight text-brand">{campaign.totalCompleted}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
                <Link
                    href={`/campaigns/${campaign.id}/leads`}
                    className="flex-1 h-9 px-3 rounded-full bg-page flex items-center justify-center gap-2 text-[12px] font-bold text-ink-3 hover:bg-ink hover:text-white transition-all"
                >
                    <Users size={13} />
                    Fila de Leads
                </Link>
                <Link
                    href={`/campaigns/${campaign.id}/results`}
                    className="flex-1 h-9 px-3 rounded-full border border-edge flex items-center justify-center gap-2 text-[12px] font-bold text-ink-3 hover:border-ink hover:text-ink transition-all"
                >
                    <Zap size={13} />
                    Resultados
                </Link>
            </div>

            <a
                href={campaign.postUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-ink-4 hover:text-brand flex items-center justify-center gap-1 transition-colors"
            >
                Ver post original <ExternalLink size={10} />
            </a>
        </div>
    )
}
