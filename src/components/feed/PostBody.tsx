"use client";

import React, { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface PostBodyProps {
    text: string
    imageUrls?: string[]
    videoUrl?: string
    articleUrl?: string
    articleTitle?: string
}

export function PostBody({ text, imageUrls, articleUrl, articleTitle }: PostBodyProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const isLong = text.length > 320

    return (
        <div className="space-y-4">
            <div className="relative">
                <p className={cn(
                    "t-body text-ink-2 whitespace-pre-wrap transition-all",
                    !isExpanded && isLong && "line-clamp-5"
                )}>
                    {text}
                </p>

                {isLong && !isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="t-caption font-bold text-primary mt-2 hover:underline decoration-primary/30 underline-offset-4"
                    >
                        ...ver mais
                    </button>
                )}
            </div>

            {imageUrls && imageUrls.length > 0 && (
                <div className={cn(
                    "grid gap-2 rounded-[var(--r-xl)] overflow-hidden border border-edge shadow-sm",
                    imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"
                )}>
                    {imageUrls.map((url, i) => (
                        <Image
                            key={i}
                            src={url}
                            alt="Post content"
                            width={800}
                            height={400}
                            unoptimized
                            className="w-full h-auto object-cover max-h-[400px] hover:scale-[1.01] transition-transform duration-[var(--t-slow)] cursor-pointer"
                        />
                    ))}
                </div>
            )}

            {articleUrl && (
                <a
                    href={articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-[var(--r-xl)] border border-edge bg-page p-5 hover:border-primary/40 hover:bg-white transition-all duration-[var(--t-base)] group/article shadow-sm"
                >
                    <span className="t-label text-primary font-bold uppercase tracking-wider">Artigo</span>
                    <h4 className="t-title text-ink mt-2 group-hover/article:text-primary transition-colors">{articleTitle || 'Visualizar Artigo'}</h4>
                    <span className="t-caption text-ink-3 mt-1 block truncate font-mono opacity-80">{articleUrl}</span>
                </a>
            )}
        </div>
    )
}
