"use client";

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function PostCardSkeleton() {
    return (
        <div className="rounded-[var(--r-xl)] border border-edge bg-white p-[22px_24px] space-y-5 mb-6 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3">
                <Skeleton className="h-[38px] w-[38px] rounded-full bg-hover" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[140px] bg-hover" />
                    <Skeleton className="h-3 w-[100px] bg-hover" />
                </div>
            </div>

            <div className="space-y-3">
                <Skeleton className="h-4 w-full bg-hover" />
                <Skeleton className="h-4 w-full bg-hover" />
                <Skeleton className="h-4 w-2/3 bg-hover" />
            </div>

            <div className="flex gap-5 pt-3 border-t border-edge/30">
                <Skeleton className="h-3 w-12 bg-hover" />
                <Skeleton className="h-3 w-12 bg-hover" />
                <Skeleton className="h-3 w-12 bg-hover" />
            </div>
        </div>
    )
}
