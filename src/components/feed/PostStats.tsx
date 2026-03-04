"use client";

import React from 'react'
import { PostMetrics } from '@/types/linkedin.types'
import { formatNumber } from '@/lib/utils/format'
import { ThumbsUp, MessageCircle, Repeat2, Eye } from 'lucide-react'

interface PostStatsProps {
    metrics: PostMetrics
}

export function PostStats({ metrics }: PostStatsProps) {
    return (
        <div className="flex items-center gap-5 mt-6 border-t border-edge/50 pt-5">
            <StatItem
                icon={<ThumbsUp size={15} />}
                value={metrics.likes}
                label="likes"
            />
            <StatItem
                icon={<MessageCircle size={15} />}
                value={metrics.comments}
                label="comments"
            />
            <StatItem
                icon={<Repeat2 size={15} />}
                value={metrics.reposts}
                label="reposts"
            />
            {metrics.views !== undefined && (
                <StatItem
                    icon={<Eye size={15} />}
                    value={metrics.views}
                    label="views"
                />
            )}
        </div>
    )
}

function StatItem({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) {
    return (
        <div className="flex items-center gap-2 text-ink-4 group/stat transition-all hover:text-ink cursor-default">
            <span className="group-hover/stat:scale-110 transition-transform [&_svg]:stroke-[1.8]">
                {icon}
            </span>
            <span className="text-[13px] font-bold text-ink group-hover/stat:text-ink transition-colors">
                {formatNumber(value)}
            </span>
            <span className="text-[11px] text-ink-4">
                {label}
            </span>
        </div>
    )
}
