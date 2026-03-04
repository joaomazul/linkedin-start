"use client";

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
        <div className="max-w-4xl mx-auto w-full px-6 py-8 space-y-8 page-enter">

            {/* Header */}
            <div>
                <h2 className="text-[28px] font-black tracking-[-1px] text-ink">
                    Conta LinkedIn
                </h2>
                <p className="text-[13px] font-medium text-ink-4 mt-[5px] max-w-lg">
                    Conexões Unipile e automação do feed LinkedFlow.
                </p>
            </div>

            {/* 1. SELEÇÃO DE CONTA */}
            <section className="bg-white border border-edge rounded-[var(--r-xl)] p-[22px_24px] shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-[30px] w-[30px] rounded-[var(--r-sm)] bg-brand/10 flex items-center justify-center text-brand">
                        <Link2 size={20} />
                    </div>
                    <h3 className="text-[14px] font-bold text-ink">Contas Conectadas</h3>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={24} className="text-brand animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className={cn(
                            "flex items-center justify-between p-6 rounded-xl border transition-all duration-[var(--t-base)]",
                            statusData?.status === 'OK'
                                ? "bg-primary/5 border-primary shadow-lg shadow-primary/10"
                                : "bg-red-500/5 border-red-500/20"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className="h-[48px] w-[48px] rounded-xl bg-page border border-edge flex items-center justify-center lf-title text-primary uppercase font-bold">
                                    IN
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[14px] font-bold text-ink">
                                        LinkedFlow Principal
                                    </p>
                                    <p className="lf-caption text-ink-4 font-mono mt-0.5">
                                        {linkedinAccountId || 'Unlinked'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {statusData?.status === 'OK' ? (
                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-success-text/15 text-success-text lf-label font-bold uppercase tracking-wider">
                                        <div className="h-2 w-2 rounded-full bg-success-text animate-pulse" />
                                        Connected
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/15 text-red-500 lf-label font-bold uppercase tracking-wider">
                                        <div className="h-2 w-2 rounded-full bg-red-500" />
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
                                className="lf-caption bg-page border border-edge hover:bg-hover text-ink-2 h-10 px-4 rounded-r-sm"
                            >
                                <RefreshCw size={14} className={cn("mr-2", isLoading && "animate-spin")} /> Check Connection
                            </Button>

                            {(!statusData || statusData.status !== 'OK') && (
                                <Button asChild className="lf-caption bg-brand hover:bg-brand-dark text-white h-10 px-4 rounded-r-sm border-none shadow-accent">
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
            <section className="bg-white border border-edge rounded-[var(--r-xl)] p-[22px_24px] shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-[30px] w-[30px] rounded-[var(--r-sm)] bg-brand/10 flex items-center justify-center text-brand">
                        <RefreshCw size={20} />
                    </div>
                    <h3 className="text-[14px] font-bold text-ink">Automação de Atualização</h3>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-lg bg-page border border-edge">
                    <div className="space-y-1">
                        <Label className="text-[14px] font-bold text-ink">Refresh do Feed Automático</Label>
                        <p className="lf-caption text-ink-3">Frequência ideal para capturar posts em tempo real.</p>
                    </div>
                    <div className="w-full md:w-[200px]">
                        <Select
                            value={String(autoRefreshInterval)}
                            onValueChange={(val) => updateSettings({ autoRefreshInterval: Number(val) })}
                        >
                            <SelectTrigger className="bg-page border-edge rounded-r-sm h-11 lf-body-sm text-ink-2">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-page border-edge">
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
            <section className="bg-white border border-edge rounded-[var(--r-xl)] p-[22px_24px] shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-[30px] w-[30px] rounded-[var(--r-sm)] bg-brand/10 flex items-center justify-center text-brand">
                        <Settings2 size={20} />
                    </div>
                    <h3 className="text-[14px] font-bold text-ink">Webhooks em Tempo Real</h3>
                </div>

                <div className="bg-page rounded-lg border border-edge p-6">
                    <p className="lf-body-sm text-ink-2 mb-6">
                        Configure esta URL no Unipile para receber notificações instantâneas e comentar primeiro em todos os posts relevantes.
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-14 bg-page border border-edge rounded-xl px-4 flex items-center font-mono text-sm text-primary overflow-hidden select-all bg-opacity-50">
                            {webhookUrl}
                        </div>
                        <Button
                            onClick={handleCopyWebhook}
                            variant="accent"
                            size="icon-lg"
                        >
                            <Copy size={18} />
                        </Button>
                    </div>

                    <div className="mt-8 flex items-start gap-4 p-5 rounded-lg bg-brand/5 border border-brand/20">
                        <Lock className="text-brand mt-1" size={16} />
                        <div>
                            <p className="text-[13px] text-ink font-bold mb-1">Segurança e Eficiência</p>
                            <p className="lf-caption text-ink-3 leading-relaxed">
                                Webhooks eliminam a necessidade de polling constante, economizando recursos e garantindo a maior velocidade de publicação.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}
