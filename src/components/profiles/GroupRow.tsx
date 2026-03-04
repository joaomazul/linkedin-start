"use client";

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen, MoreVertical, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useProfilesStore } from '@/store/profiles.store'
import { useShallow } from 'zustand/react/shallow'
import { ProfileRow } from './ProfileRow'
import { AddProfileModal } from './AddProfileModal'
import { useEffect, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import Link from 'next/link'

interface GroupRowProps {
    groupId: string
    searchQuery?: string
}

export const GroupRow = React.memo(function GroupRow({ groupId, searchQuery }: GroupRowProps) {
    const group = useProfilesStore((s) => s.groups.find((g) => g.id === groupId))
    const allProfiles = useProfilesStore(
        useShallow((s) => s.profiles.filter((p) => p.groupId === groupId))
    )
    const [isOpen, setIsOpen] = useState(true)

    // Filter profiles by search query if provided
    const profiles = searchQuery
        ? allProfiles.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : allProfiles

    if (!group) return null

    return (
        <div className="flex flex-col">
            {/* Group Header */}
            <div
                className={cn(
                    "group flex h-[44px] items-center px-3 gap-2 cursor-pointer transition-colors",
                    "hover:bg-page",
                    isOpen && "bg-page/50"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="text-ink-3">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>

                <div
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)]"
                    style={{ backgroundColor: `${group.color}20`, color: group.color || 'var(--blue)' }}
                >
                    {isOpen ? <FolderOpen size={15} /> : <Folder size={15} />}
                </div>

                <Link
                    href={`/settings/groups/${group.id}`}
                    className="flex-1 truncate text-[13px] font-bold text-ink hover:text-brand transition-colors leading-tight"
                    onClick={(e) => e.stopPropagation()}
                >
                    {group.name}
                </Link>

                <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[22px] text-center"
                    style={{ backgroundColor: `${group.color}15`, color: group.color || 'var(--ink-3)' }}
                >
                    {searchQuery ? `${profiles.length}/${allProfiles.length}` : allProfiles.length}
                </span>

                <div className="flex items-center gap-1 ml-0.5">
                    <button
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-brand/10 rounded text-brand transition-all"
                        onClick={(e) => {
                            e.stopPropagation()
                            const event = new CustomEvent('open-add-profile', {
                                detail: { groupId: group.id }
                            })
                            window.dispatchEvent(event)
                        }}
                        title="Adicionar perfil ao grupo"
                    >
                        <Plus size={13} />
                    </button>

                    <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                        <Switch
                            checked={profiles.length > 0 && profiles.every(p => p.active)}
                            onCheckedChange={async (checked) => {
                                useProfilesStore.getState().toggleGroup(groupId, checked)
                                try {
                                    await fetch(`/api/linkedin/groups/${groupId}/toggle`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ active: checked })
                                    })
                                } catch (err) {
                                    console.error(err)
                                    toast.error('Erro ao sincronizar status do grupo')
                                }
                            }}
                            className="bg-hover data-[state=checked]:bg-brand scale-75"
                        />
                    </div>

                    <Link
                        href={`/settings/groups/${group.id}`}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-hover rounded text-ink-3"
                        onClick={(e) => e.stopPropagation()}
                        title="Gerenciar Leads"
                    >
                        <MoreVertical size={13} />
                    </Link>
                </div>
            </div>

            {/* Profiles inside group */}
            {isOpen && (
                <div
                    className="flex flex-col pl-4 ml-6 mt-0.5 mb-2 border-l-2 rounded-bl"
                    style={{ borderColor: `${group.color}30` }}
                >
                    {profiles.length === 0 ? (
                        <div className="py-2 px-3">
                            <p className="t-caption text-ink-4 italic">Vazio</p>
                        </div>
                    ) : (
                        profiles.map((p) => (
                            <ProfileRow key={p.id} profileId={p.id} />
                        ))
                    )}
                </div>
            )}
        </div>
    )
})
