"use client";

import React, { useState, useRef, useEffect } from 'react'
import { formatRelativeTime } from '@/lib/utils/format'
import { ExternalLink, MoreHorizontal, UserX, ExternalLink as LinkIcon } from 'lucide-react'
import { useProfilesStore } from '@/store/profiles.store'
import { toast } from 'sonner'

interface PostHeaderProps {
    authorName: string
    authorRole: string
    authorInitials: string
    authorColor: string
    authorId?: string
    postedAt: string
    url?: string
}

export function PostHeader({
    authorName,
    authorRole,
    authorInitials,
    authorColor,
    authorId,
    postedAt,
    url
}: PostHeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [menuOpen])

    const handleRemoveProfile = async () => {
        if (!authorId) return
        setMenuOpen(false)

        // Optimistically toggle profile off
        useProfilesStore.getState().toggleProfile(authorId)

        try {
            const res = await fetch(`/api/linkedin/profiles/${authorId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: false }),
            })
            if (!res.ok) throw new Error('Falha ao desativar')
            toast.success(`${authorName} removido das fontes`)
        } catch {
            // Revert on failure
            useProfilesStore.getState().toggleProfile(authorId)
            toast.error('Não foi possível remover o perfil')
        }
    }

    return (
        <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
                    style={{
                        backgroundColor: `${authorColor}15`,
                        color: authorColor,
                    }}
                >
                    {authorInitials}
                </div>

                <div className="flex flex-col min-w-0">
                    <h3 className="text-[15px] font-bold text-ink leading-tight truncate">
                        {authorName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-ink-3 truncate max-w-[200px]">
                            {authorRole}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-edge" />
                        <span className="text-[11px] text-ink-4">
                            {formatRelativeTime(postedAt)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {url && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-page rounded-full border-none px-3 py-1.5 text-[11px] font-semibold text-ink-3 hover:bg-ink hover:text-white transition-all"
                        title="Ver no LinkedIn"
                    >
                        Abrir Post
                        <ExternalLink size={12} />
                    </a>
                )}

                {/* 3-dot menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="h-7 w-7 rounded-[var(--r-sm)] bg-page text-ink-4 hover:bg-ink hover:text-white flex items-center justify-center transition-all"
                    >
                        <MoreHorizontal size={14} />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-9 z-50 w-[200px] bg-white border border-edge rounded-[var(--r-md)] shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                            {url && (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-ink-3 hover:bg-page hover:text-ink transition-colors w-full"
                                >
                                    <LinkIcon size={14} />
                                    Abrir no LinkedIn
                                </a>
                            )}
                            {authorId && (
                                <button
                                    onClick={handleRemoveProfile}
                                    className="flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-danger-text hover:bg-danger-bg transition-colors w-full text-left"
                                >
                                    <UserX size={14} />
                                    Remover das fontes
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
