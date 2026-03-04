"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Users, Search, X } from 'lucide-react'
import { useProfilesStore } from '@/store/profiles.store'
import { useFeedStore } from '@/store/feed.store'
import { useHistoryStore } from '@/store/history.store'
import { GroupRow } from '@/components/profiles/GroupRow'
import { ProfileRow } from '@/components/profiles/ProfileRow'
import { AddProfileModal } from '@/components/profiles/AddProfileModal'

export function LeftPanel() {
    const groups = useProfilesStore((s) => s.groups)
    const profiles = useProfilesStore((s) => s.profiles)
    const postsCount = useFeedStore((s) => s.posts.length)
    const historyCount = useHistoryStore((s) => s.entries.length)
    const activeCount = profiles.filter(p => p.active).length

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [preselectedGroupId, setPreselectedGroupId] = useState<string | undefined>()
    const [searchQuery, setSearchQuery] = useState('')

    // Listen for global custom event to open modal (from GroupRow plus buttons)
    const handleOpenModal = useCallback((e: Event) => {
        const detail = (e as CustomEvent).detail
        if (detail?.groupId) {
            setPreselectedGroupId(detail.groupId)
        } else {
            setPreselectedGroupId(undefined)
        }
        setIsModalOpen(true)
    }, [])

    useEffect(() => {
        window.addEventListener('open-add-profile', handleOpenModal)
        return () => window.removeEventListener('open-add-profile', handleOpenModal)
    }, [handleOpenModal])

    // Profiles without a group
    const ungroupedProfiles = useMemo(() => {
        const ungrouped = profiles.filter(p => !p.groupId)
        if (!searchQuery) return ungrouped
        const q = searchQuery.toLowerCase()
        return ungrouped.filter(p => p.name.toLowerCase().includes(q))
    }, [profiles, searchQuery])

    // Filter groups that have matching profiles
    const filteredGroups = useMemo(() => {
        if (!searchQuery) return groups
        const q = searchQuery.toLowerCase()
        return groups.filter(g => {
            const groupProfiles = profiles.filter(p => p.groupId === g.id)
            return g.name.toLowerCase().includes(q) || groupProfiles.some(p => p.name.toLowerCase().includes(q))
        })
    }, [groups, profiles, searchQuery])

    return (
        <aside className="flex w-[260px] h-full flex-col border-l border-edge bg-white shrink-0 overflow-hidden">
            {/* Header: Gerenciar / Batch */}
            <div className="p-3 shrink-0">
                <button
                    onClick={() => {
                        setPreselectedGroupId(undefined)
                        setIsModalOpen(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--r-md)] bg-page text-ink-3 text-[12px] font-bold transition-all hover:bg-lime hover:text-ink"
                >
                    <Plus size={14} strokeWidth={2.5} />
                    Gerenciar / Batch
                </button>
            </div>

            {/* Search filter */}
            <div className="px-3 pb-2 shrink-0">
                <div className="flex items-center gap-2 bg-page rounded-[var(--r-md)] px-3 py-[7px] transition-colors focus-within:ring-1 focus-within:ring-brand/30">
                    <Search size={13} className="text-ink-4 shrink-0" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar perfil..."
                        className="text-[12px] font-medium text-ink bg-transparent flex-1 outline-none placeholder:text-ink-4 min-w-0"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-ink-4 hover:text-ink transition-colors shrink-0"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Section Label */}
            <div className="px-4 pb-2">
                <span className="text-[9px] font-bold tracking-[1.5px] uppercase text-ink-4">
                    Organização
                </span>
            </div>

            {/* Scrollable Groups + Profiles */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredGroups.length === 0 && ungroupedProfiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--r-md)] bg-page">
                            <Users size={18} className="text-ink-4" />
                        </div>
                        <p className="text-[11px] font-semibold text-ink-3">
                            {searchQuery ? 'Nenhum resultado' : 'Nenhum perfil'}
                        </p>
                        <p className="text-[10px] text-ink-4">
                            {searchQuery ? `Sem resultados para "${searchQuery}"` : 'Adicione perfis para monitorar'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Groups */}
                        {filteredGroups.map((group) => (
                            <GroupRow key={group.id} groupId={group.id} searchQuery={searchQuery} />
                        ))}

                        {/* Ungrouped profiles */}
                        {ungroupedProfiles.length > 0 && (
                            <div className="mt-1">
                                <div className="px-3 py-1.5">
                                    <span className="text-[9px] font-bold tracking-[1px] uppercase text-ink-4">
                                        Sem grupo
                                    </span>
                                </div>
                                {ungroupedProfiles.map((p) => (
                                    <ProfileRow key={p.id} profileId={p.id} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Stats Footer */}
            <div className="shrink-0 border-t border-edge h-[56px] flex items-center">
                <StatBox label="Posts" value={postsCount} />
                <StatBox label="Feitos" value={historyCount} />
                <StatBox label="Ativos" value={activeCount} highlight={activeCount > 0} />
            </div>

            {/* Add Profile Modal */}
            <AddProfileModal
                open={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setPreselectedGroupId(undefined)
                }}
                defaultGroupId={preselectedGroupId}
            />
        </aside>
    )
}

function StatBox({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors">
            <span className={`text-[16px] font-bold leading-none ${highlight ? 'text-brand' : 'text-ink'}`}>
                {value}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[1px] text-ink-4">
                {label}
            </span>
        </div>
    )
}
