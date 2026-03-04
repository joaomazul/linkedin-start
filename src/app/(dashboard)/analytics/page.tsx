"use client";

import { useEffect, useState } from 'react'
import { OverviewCards } from '@/components/analytics/OverviewCards'
import { PerformanceChart } from '@/components/analytics/PerformanceChart'
import { InsightsFeed } from '@/components/analytics/InsightsFeed'
import { TopPosts } from '@/components/analytics/TopPosts'
import { BestTimesHeatmap } from '@/components/analytics/BestTimesHeatmap'
import { FormatBreakdown } from '@/components/analytics/FormatBreakdown'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function AnalyticsPage() {
    const [period, setPeriod] = useState('30d')
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        fetchData()
    }, [period])

    async function fetchData() {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/analytics/overview?period=${period}`)
            const json = await res.json()
            if (json.ok) {
                setData(json.data)
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
            toast.error('Erro ao carregar dados de analytics')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleMarkAsRead(id: string) {
        try {
            await fetch(`/api/analytics/insights/${id}`, { method: 'PATCH' })
            setData((prev: any) => ({
                ...prev,
                recentInsights: prev.recentInsights.filter((i: any) => i.id !== id)
            }))
        } catch (error) {
            console.error('Erro ao marcar insight como lido')
        }
    }
    // Usa dados reais dos snapshots e do postPerformance (calculados no server via API)
    const chartData = data?.metrics?.chartData || []
    const heatmapData = data?.metrics?.heatmapData || []
    const formatBreakdown = data?.metrics?.formatBreakdown || []

    return (
        <div className="flex-1 space-y-6 py-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-sm text-muted-foreground">
                        Acompanhe seu desempenho no LinkedIn e o progresso das suas campanhas.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecionar Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Últimos 7 dias</SelectItem>
                            <SelectItem value="30d">Últimos 30 dias</SelectItem>
                            <SelectItem value="90d">Últimos 90 dias</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <OverviewCards data={data?.metrics} isLoading={isLoading} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <PerformanceChart
                    data={chartData}
                    title="Engajamento no LinkedIn"
                    dataKey="value"
                    color="#0ea5e9"
                />
                <div className="lg:col-span-2">
                    <FormatBreakdown data={formatBreakdown} />
                </div>
                <div className="lg:col-span-3">
                    <BestTimesHeatmap data={heatmapData} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <TopPosts posts={data?.topPosts || []} />
                </div>
                <div className="lg:col-span-3">
                    <InsightsFeed
                        insights={data?.recentInsights || []}
                        onMarkAsRead={handleMarkAsRead}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    )
}
