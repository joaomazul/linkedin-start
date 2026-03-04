"use client";

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Target,
    Zap,
    Users,
    CheckCircle2,
    Clock,
    ExternalLink,
    ChevronLeft,
    TrendingUp,
    Activity,
    AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Campaign {
    id: string
    name: string
    status: string
    postUrl: string
    totalCaptured: number
    totalApproved: number
    totalCompleted: number
    createdAt: string
    expiresAt: string
}

interface CampaignEvent {
    id: string
    eventType: string
    payload: any
    createdAt: string
}

export default function CampaignResultsPage() {
    const params = useParams()
    const id = params.id as string
    const router = useRouter()
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [events, setEvents] = useState<CampaignEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [cRes, eRes] = await Promise.all([
                    fetch('/api/campaigns'),
                    fetch(`/api/campaigns/${id}/events`),
                ])
                const cData = await cRes.json()
                const eData = await eRes.json()
                const found = cData.data?.find((c: any) => c.id === id)
                setCampaign(found)
                setEvents(eData.data || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <Activity className="animate-spin text-brand" size={32} />
        </div>
    )

    if (!campaign) return (
        <div className="p-20 text-center flex flex-col items-center gap-4">
            <AlertCircle className="text-red-400" size={48} />
            <h3 className="lf-title text-xl">Campanha não encontrada</h3>
            <button onClick={() => router.push('/campaigns')} className="text-brand underline">Voltar</button>
        </div>
    )

    const conversionRate = campaign.totalCaptured > 0
        ? Math.round((campaign.totalApproved / campaign.totalCaptured) * 100)
        : 0

    return (
        <div className="flex flex-col h-full bg-page">
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="w-full mb-2">
                        <button onClick={() => router.push('/campaigns')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                            <ChevronLeft size={16} /> Voltar para Campanhas
                        </button>
                        <div className="flex items-center justify-between border-b border-edge pb-6">
                            <div>
                                <h1 className="text-2xl font-bold">{campaign.name}</h1>
                                <p className="text-sm text-muted-foreground mt-1">Dashboard de Resultados e Performance</p>
                            </div>
                            <a
                                href={campaign.postUrl}
                                target="_blank"
                                className="h-10 px-4 border border-edge rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-white transition-all bg-white"
                            >
                                Ver Post Original <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCard icon={<Users size={20} />} label="Leads Capturados" value={campaign.totalCaptured} color="text-ink-2" />
                        <StatCard icon={<CheckCircle2 size={20} />} label="Aprovados" value={campaign.totalApproved} color="text-emerald-500" />
                        <StatCard icon={<Zap size={20} />} label="Ações Realizadas" value={campaign.totalCompleted} color="text-brand" />
                        <StatCard icon={<TrendingUp size={20} />} label="Conversão" value={`${conversionRate}%`} color="text-indigo-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Status Card */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white border border-edge rounded-2xl p-6 shadow-sm">
                                <h4 className="lf-label text-xs mb-4">Status Atual</h4>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={cn(
                                        "h-3 w-3 rounded-full animate-pulse",
                                        campaign.status === 'active' ? "bg-emerald-500" : "bg-slate-400"
                                    )} />
                                    <span className="font-bold text-ink-2 uppercase tracking-widest text-sm">
                                        {campaign.status === 'active' ? 'Em execução' : campaign.status}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-ink-4">Início:</span>
                                        <span className="font-semibold">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-ink-4">Expira em:</span>
                                        <span className="font-semibold">{new Date(campaign.expiresAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Log */}
                        <div className="lg:col-span-2">
                            <div className="bg-white border border-edge rounded-2xl p-6 shadow-sm h-full flex flex-col">
                                <h4 className="lf-label text-xs mb-6 flex items-center gap-2">
                                    <Activity size={14} /> Log de Atividade
                                </h4>

                                <div className="flex-1 space-y-6 overflow-y-auto">
                                    {events.length === 0 ? (
                                        <div className="h-40 flex flex-col items-center justify-center gap-3 text-ink-4">
                                            <Clock size={32} strokeWidth={1} />
                                            <span className="text-xs">Aguardando as primeiras interações...</span>
                                        </div>
                                    ) : (
                                        events.map(event => (
                                            <div key={event.id} className="flex gap-4 items-start pl-2 border-l-2 border-white relative">
                                                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-4 border-brand" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-ink-2">{event.eventType}</span>
                                                        <span className="text-[10px] text-ink-4">{new Date(event.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-xs text-ink-3">Ação concluída com sucesso para o lead</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
    return (
        <div className="bg-white border border-edge rounded-2xl p-6 shadow-sm flex flex-col gap-1 transition-transform hover:-translate-y-1">
            <div className={cn("mb-2", color)}>{icon}</div>
            <span className="lf-label text-[10px] text-ink-4 uppercase tracking-wider">{label}</span>
            <span className={cn("text-2xl font-extrabold tracking-tight", color)}>{value}</span>
        </div>
    )
}
