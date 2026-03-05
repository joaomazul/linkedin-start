"use client";

import React, { useState } from 'react'
import { RefreshCw, Menu, Zap } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useFeedStore } from '@/store/feed.store'
import { formatRelativeTime } from '@/lib/utils/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TopbarProps {
    title: string
    badge?: string
    children?: React.ReactNode
    onMenuClick?: () => void
}

export function Topbar({ title, children, onMenuClick }: TopbarProps) {
    const lastRefreshedAt = useFeedStore((s) => s.lastRefreshedAt)
    const queryClient = useQueryClient()
    const [syncing, setSyncing] = useState(false)

    const handleRefresh = async () => {
        if (syncing) return
        setSyncing(true)
        const toastId = toast.loading('Sincronizando feed...')

        try {
            const res = await fetch('/api/linkedin/feed?sync=true')
            if (!res.ok) throw new Error('Falha ao sincronizar')

            const json = await res.json()
            await queryClient.invalidateQueries({ queryKey: ['feed'] })
            useFeedStore.setState({ lastRefreshedAt: new Date().toISOString() })

            const { syncedCount = 0, failedCount = 0, skippedCount = 0 } = json.data || {}

            if (failedCount > 0 && syncedCount > 0) {
                toast.warning(`Sincronizado parcialmente: ${syncedCount} ok, ${failedCount} falharam`, { id: toastId })
            } else if (failedCount > 0 && syncedCount === 0) {
                toast.error('Falha na sincronização', { id: toastId })
            } else if (syncedCount === 0 && skippedCount > 0) {
                toast.success(`Feed já está atualizado`, { id: toastId })
            } else {
                toast.success(`Feed sincronizado (${syncedCount} perfis)`, { id: toastId })
            }
        } catch (err) {
            toast.error('Erro na conexão com o servidor', { id: toastId })
        } finally {
            setSyncing(false)
        }
    }

    return (
        <header className="h-[var(--topbar-height)] bg-white border-b border-edge flex items-center px-4 md:px-5 gap-3 shrink-0 grow-0 sticky top-0 z-50 shadow-xs">
            {/* Mobile menu */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-ink-3 hover:text-ink hover:bg-page rounded-[10px] transition-colors"
            >
                <Menu size={18} />
            </button>

            {/* Logo zone — aligned with sidebar (72px) */}
            <div className="hidden lg:flex w-[40px] shrink-0 items-center justify-center">
                <div className="h-8 w-8 rounded-[10px] bg-ink flex items-center justify-center">
                    <span className="text-lime text-[10px] font-bold tracking-tight">LF</span>
                </div>
            </div>

            {/* Page title */}
            <h1 className="text-[15px] font-bold text-ink">
                {title}
            </h1>

            {/* Center slot */}
            <div className="flex-1 flex justify-center items-center px-4">
                {children}
            </div>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-3">
                {/* Last synced timestamp */}
                <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-[11px] text-ink-4">
                        {lastRefreshedAt
                            ? `Atualizado ${formatRelativeTime(lastRefreshedAt)}`
                            : 'Nunca sincronizado'
                        }
                    </span>
                </div>

                {/* Credit pill */}
                <div className="hidden sm:flex items-center gap-1.5 bg-page rounded-full px-3 py-1.5">
                    <Zap size={12} className="text-ink" />
                    <span className="text-xs font-semibold text-ink-4">
                        <span className="text-ink">∞</span> créditos
                    </span>
                </div>

                {/* Refresh button */}
                <button
                    onClick={handleRefresh}
                    disabled={syncing}
                    className="relative h-8 w-8 rounded-[10px] bg-page text-ink-3 flex items-center justify-center hover:bg-ink hover:text-white transition-all duration-[var(--t-base)] group disabled:opacity-50"
                >
                    <RefreshCw size={14} className={cn("group-hover:rotate-180 transition-transform duration-500", syncing && "animate-spin")} />
                </button>
            </div>
        </header>
    )
}
