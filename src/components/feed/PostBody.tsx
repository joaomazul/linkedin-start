"use client";

import React, { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ImageOff } from 'lucide-react'

interface PostBodyProps {
    text: string
    imageUrls?: string[]
    videoUrl?: string
    articleUrl?: string
    articleTitle?: string
}

function PostImage({ url }: { url: string }) {
    const [error, setError] = useState(false)

    if (error) {
        return (
            <div className="w-full h-[200px] bg-page flex flex-col items-center justify-center gap-2 text-ink-4">
                <ImageOff size={24} strokeWidth={1.5} />
                <span className="text-[11px] font-medium">Imagem indisponível</span>
            </div>
        )
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={url}
            alt="Post content"
            loading="lazy"
            onError={() => setError(true)}
            className="w-full h-auto object-cover max-h-[400px] hover:scale-[1.01] transition-transform duration-[var(--t-slow)] cursor-pointer"
        />
    )
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
                        <PostImage key={i} url={url} />
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
