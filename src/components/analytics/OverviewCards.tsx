import { MetricCard } from '@/components/ui/metric-card'
import { TargetIcon, BarChart2, Users } from 'lucide-react'

interface OverviewCardsProps {
    data?: {
        scoreAccuracy: number | null
        leadsCaptured: number
        totalLikes: number
        totalComments: number
        conversionRate: number
        trend: {
            leads: number
            engagement: number
        }
    }
    isLoading?: boolean
}

export function OverviewCards({ data, isLoading }: OverviewCardsProps) {
    return (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
                variant="default"
                label="Score da IA vs Real"
                value={data?.scoreAccuracy !== null && data?.scoreAccuracy !== undefined ? `${data.scoreAccuracy}%` : 'N/A'}
                icon={<TargetIcon size={16} />}
                isLoading={isLoading}
            />
            <MetricCard
                variant="dark"
                label="Leads Capturados"
                value={data?.leadsCaptured ?? 0}
                trend={data?.trend.leads !== undefined ? { value: data.trend.leads, direction: data.trend.leads > 0 ? 'up' : data.trend.leads < 0 ? 'down' : 'neutral' } : undefined}
                icon={<TargetIcon size={16} />}
                isLoading={isLoading}
            />
            <MetricCard
                variant="lime"
                label="Engajamento Total"
                value={(data?.totalLikes ?? 0) + (data?.totalComments ?? 0)}
                trend={data?.trend.engagement !== undefined ? { value: data.trend.engagement, direction: data.trend.engagement > 0 ? 'up' : data.trend.engagement < 0 ? 'down' : 'neutral' } : undefined}
                icon={<BarChart2 size={16} />}
                isLoading={isLoading}
            />
            <MetricCard
                variant="default"
                label="Taxa de Conversão"
                value={`${Math.round(data?.conversionRate ?? 0)}%`}
                icon={<Users size={16} />}
                isLoading={isLoading}
            />
        </div>
    )
}
