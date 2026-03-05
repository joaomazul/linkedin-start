"use client";

import React from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { LeftPanel } from './LeftPanel'
import { usePathname } from 'next/navigation'
import { AccountStatusBanner } from '@/components/unipile/AccountStatusBanner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

import { useSettingsStore } from '@/store/settings.store'
import { useProfilesStore } from '@/store/profiles.store'

interface AppShellProps {
    children: React.ReactNode
    title: string
}

export function AppShell({ children, title }: AppShellProps) {
    const pathname = usePathname()
    const isFeed = pathname === '/feed'
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

    const setSettings = useSettingsStore(s => s.setSettings)
    const updatePersona = useSettingsStore(s => s.updatePersona)
    const updateCommentStyle = useSettingsStore(s => s.updateCommentStyle)
    const setProfiles = useProfilesStore(s => s.setProfiles)
    const setGroups = useProfilesStore(s => s.setGroups)

    // Hidratação DB -> Zustand (Caso localStore esteja vazio)
    React.useEffect(() => {
        async function hydrate() {
            try {
                // Sempre tentamos hidratar se estivermos logados para garantir paridade com DB
                const res = await fetch('/api/settings')
                const json = await res.json()

                if (json.ok && json.data) {
                    const { data } = json

                    // Atualiza configurações básicas
                    const accountId = data.linkedinAccountId || process.env.NEXT_PUBLIC_UNIPILE_LINKEDIN_ACCOUNT_ID

                    setSettings({
                        linkedinAccountId: accountId || undefined,
                        autoRefreshInterval: data.autoRefreshInterval || 0
                    })

                    if (data.persona) {
                        updatePersona(data.persona)
                    }
                    if (data.groups) {
                        setGroups(data.groups)
                    }
                    if (data.profiles && data.profiles.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setProfiles(data.profiles.map((p: any) => ({
                            id: p.id,
                            name: p.name || 'Perfil',
                            url: p.linkedinUrl || p.url || '',
                            linkedinUrl: p.linkedinUrl || p.url || '',
                            linkedinId: p.linkedinId ?? undefined,
                            role: p.role || '',
                            company: p.company ?? undefined,
                            avatarUrl: p.avatarUrl ?? undefined,
                            initials: p.initials || (p.name || '??').split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
                            color: p.color || '#6366f1',
                            active: p.active ?? true,
                            groupId: p.groupId ?? undefined,
                            addedAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
                            lastFetchedAt: p.lastFetchedAt ? new Date(p.lastFetchedAt).toISOString() : undefined,
                        })))
                    }
                    if (data.styles && data.styles.length > 0) {
                        data.styles.forEach((style: { styleKey: Parameters<typeof updateCommentStyle>[0]; prompt: string; active: boolean; label: string }) => {
                            updateCommentStyle(style.styleKey, {
                                prompt: style.prompt,
                                active: style.active,
                                label: style.label
                            })
                        })
                    }
                }
            } catch (err) {
                console.error('Falha na hidratação de segurança:', err)
            }
        }
        hydrate()
    }, [setSettings, updatePersona, updateCommentStyle, setProfiles, setGroups])

    return (
        <div className="flex h-screen overflow-hidden bg-page">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-[70] transition-transform duration-300 transform lg:relative lg:translate-x-0 w-[72px] shrink-0 h-full",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <Sidebar />
            </div>

            {/* Main Content Area — now wider without left panel */}
            <div className="flex flex-1 flex-col overflow-hidden relative">
                <Topbar
                    title={title}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-page">
                    <AccountStatusBanner />
                    <div className="relative pb-10 px-5 max-w-[var(--content-max)] mx-auto w-full page-enter">
                        {children}
                    </div>
                </main>
            </div>

            {/* Right Panel — Organization (Feed only) */}
            {isFeed && (
                <div className="hidden lg:block h-full shrink-0">
                    <LeftPanel />
                </div>
            )}
        </div>
    )
}
