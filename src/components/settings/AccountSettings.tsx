"use client";

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings.store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Link2,
    ExternalLink,
    Copy,
    RefreshCw,
    Settings2,
    Lock,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

export function AccountSettings() {
    const linkedinAccountId = useSettingsStore(s => s.linkedinAccountId)
    const autoRefreshInterval = useSettingsStore(s => s.autoRefreshInterval || 0)
    const updateSettings = (updates: { autoRefreshInterval: number }) => {
        useSettingsStore.setState(updates)
    }

    const { data: statusData, isLoading, refetch } = useQuery({
        queryKey: ['account-status'],
        queryFn: async () => {
            const res = await fetch('/api/linkedin/account-status')
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Erro')
            return json as { status: string }
        }
    })

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || '')
    const webhookUrl = `${baseUrl}/api/linkedin/webhooks`

    const handleCopyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl)
        toast.success('URL copiada para o clipboard!')
    }

    const handleVerifyStatus = async () => {
        await refetch()
        toast.success('Status da conta verificado.')
    }

    return (
        <div className="max-w-4xl mx-auto w-full px-6 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="space-y-2">
                <h2 className="lf-title lf-text text-3xl">
                    Conta LinkedIn
                </h2>
                <p className="lf-body text-lf-text3 max-w-lg">
                    Conexões Unipile e automação do feed LinkedFlow.
                </p>
            </div>

            {/* 1. SELEÇÃO DE CONTA */}
            <section className="bg-lf-s1 border border-lf-border rounded-lg p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-8 rounded-r-sm bg-lf-accent/20 flex items-center justify-center text-lf-accent">
                        <Link2 size={16} />
                    </div>
                    <h3 className="lf-subtitle lf-text">Contas Conectadas</h3>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={24} className="text-lf-accent animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className={cn(
                            "flex items-center justify-between p-5 rounded-lg border transition-all duration-[var(--t-normal)]",
                            statusData?.status === 'OK'
                                ? "bg-lf-accent/5 border-lf-accent shadow-lf-accent"
                                : "bg-red-500/5 border-red-500/20"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className="h-[42px] w-[42px] rounded-md bg-lf-bg border border-lf-border flex items-center justify-center lf-subtitle text-lf-accent uppercase font-bold">
                                    IN
                                </div>
                                <div className="flex flex-col">
                                    <p className="lf-subtitle lf-text">
                                        LinkedFlow Principal
                                    </p>
                                    <p className="lf-caption text-lf-text4 font-mono mt-0.5">
                                        {linkedinAccountId || 'Unlinked'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {statusData?.status === 'OK' ? (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-lf-green/15 text-lf-green lf-label font-bold uppercase tracking-wider">
                                        <div className="h-1.5 w-1.5 rounded-full bg-lf-green animate-pulse" />
                                        Active
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 text-red-400 lf-label font-bold uppercase tracking-wider">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                        Error
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={handleVerifyStatus}
                                disabled={isLoading}
                                className="lf-caption bg-lf-s2 border border-lf-border hover:bg-lf-s3 text-lf-text2 h-10 px-4 rounded-r-sm"
                            >
                                <RefreshCw size={14} className={cn("mr-2", isLoading && "animate-spin")} /> Check Connection
                            </Button>

                            {(!statusData || statusData.status !== 'OK') && (
                                <Button asChild className="lf-caption bg-lf-accent hover:bg-lf-accent2 text-white h-10 px-4 rounded-r-sm border-none shadow-lf-accent">
                                    <a href="https://app.unipile.com" target="_blank" rel="noreferrer">
                                        Reconectar Unipile <ExternalLink size={14} className="ml-2" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* 2. CONFIGURAÇÕES DE REFRESH */}
            <section className="bg-lf-s1 border border-lf-border rounded-lg p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-8 rounded-r-sm bg-lf-accent/20 flex items-center justify-center text-lf-accent">
                        <RefreshCw size={16} />
                    </div>
                    <h3 className="lf-subtitle lf-text">Automação de Atualização</h3>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-lg bg-lf-s2 border border-lf-border">
                    <div className="space-y-1">
                        <Label className="lf-subtitle lf-text">Refresh do Feed Automático</Label>
                        <p className="lf-caption text-lf-text3">Frequência ideal para capturar posts em tempo real.</p>
                    </div>
                    <div className="w-full md:w-[200px]">
                        <Select
                            value={String(autoRefreshInterval)}
                            onValueChange={(val) => updateSettings({ autoRefreshInterval: Number(val) })}
                        >
                            <SelectTrigger className="bg-lf-bg border-lf-border rounded-r-sm h-11 lf-body-sm text-lf-text2">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-lf-bg border-lf-border">
                                <SelectItem value="0">Desativado</SelectItem>
                                <SelectItem value="5">A cada 5 min</SelectItem>
                                <SelectItem value="10">A cada 10 min</SelectItem>
                                <SelectItem value="15">A cada 15 min</SelectItem>
                                <SelectItem value="30">A cada 30 min</SelectItem>
                                <SelectItem value="60">A cada 1 hora</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* 3. WEBHOOK INFO */}
            <section className="bg-lf-s1 border border-lf-border rounded-lg p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-8 rounded-r-sm bg-lf-accent/20 flex items-center justify-center text-lf-accent">
                        <Settings2 size={16} />
                    </div>
                    <h3 className="lf-subtitle lf-text">Webhooks em Tempo Real</h3>
                </div>

                <div className="bg-lf-s2 rounded-lg border border-lf-border p-6">
                    <p className="lf-body-sm text-lf-text2 mb-6">
                        Configure esta URL no Unipile para receber notificações instantâneas e comentar primeiro em todos os posts relevantes.
                    </p>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-12 bg-lf-bg border border-lf-border rounded-r-sm px-4 flex items-center font-mono lf-caption text-lf-accent overflow-hidden select-all bg-opacity-50">
                            {webhookUrl}
                        </div>
                        <Button
                            onClick={handleCopyWebhook}
                            className="h-12 w-12 bg-lf-accent hover:bg-lf-accent2 text-white rounded-r-sm shadow-lf-accent border-none p-0 flex items-center justify-center"
                        >
                            <Copy size={16} />
                        </Button>
                    </div>

                    <div className="mt-8 flex items-start gap-4 p-5 rounded-lg bg-lf-accent/5 border border-lf-accent/20">
                        <Lock className="text-lf-accent mt-1" size={16} />
                        <div>
                            <p className="lf-body-sm lf-text font-bold mb-1">Segurança e Eficiência</p>
                            <p className="lf-caption text-lf-text3 leading-relaxed">
                                Webhooks eliminam a necessidade de polling constante, economizando recursos e garantindo a maior velocidade de publicação.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}
