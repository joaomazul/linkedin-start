"use client";

import React from 'react'
import { formatRelativeTime } from '@/lib/utils/format'
import { ExternalLink, MoreHorizontal } from 'lucide-react'

interface PostHeaderProps {
    authorName: string
    authorRole: string
    authorInitials: string
    authorColor: string
    postedAt: string
    url?: string
}

export function PostHeader({
    authorName,
    authorRole,
    authorInitials,
    authorColor,
    postedAt,
    url
}: PostHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{
                        backgroundColor: `${authorColor}15`,
                        color: authorColor,
                    }}
                >
                    {authorInitials}
                </div>

                <div className="flex flex-col min-w-0">
                    <h3 className="text-[14px] font-bold text-ink leading-tight truncate">
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
                <button className="h-7 w-7 rounded-[var(--r-sm)] bg-page text-ink-4 hover:bg-ink hover:text-white flex items-center justify-center transition-all">
                    <MoreHorizontal size={14} />
                </button>
            </div>
        </div>
    )
}
