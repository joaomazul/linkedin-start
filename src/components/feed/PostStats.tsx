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
        <div className="flex items-center gap-6 mt-6 border-t border-edge/50 pt-5">
            <StatItem
                icon={<ThumbsUp size={12} />}
                value={metrics.likes}
                label="Likes"
            />
            <StatItem
                icon={<MessageCircle size={12} />}
                value={metrics.comments}
                label="Comments"
            />
            <StatItem
                icon={<Repeat2 size={12} />}
                value={metrics.reposts}
                label="Reposts"
            />
            {metrics.views !== undefined && (
                <StatItem
                    icon={<Eye size={12} />}
                    value={metrics.views}
                    label="Views"
                />
            )}
        </div>
    )
}

function StatItem({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) {
    return (
        <div className="flex items-center gap-1.5 text-ink-4 group/stat transition-all hover:text-ink cursor-default" title={label}>
            <span className="group-hover/stat:scale-110 transition-transform [&_svg]:size-[13px] [&_svg]:stroke-[1.8]">
                {icon}
            </span>
            <span className="text-[12px] font-semibold group-hover/stat:text-ink transition-colors">
                {formatNumber(value)}
            </span>
        </div>
    )
}
