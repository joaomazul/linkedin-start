"use client";

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, User, Users, Activity } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CRMPageClientProps {
    initialPeople: any[]
}

const statusLabels: Record<string, string> = {
    prospect: 'Prospect',
    qualified: 'Qualificado',
    customer: 'Cliente',
    churned: 'Perdido',
}

export default function CRMPageClient({ initialPeople }: CRMPageClientProps) {
    const [people] = useState(initialPeople)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    const filtered = people.filter(p => {
        const matchesSearch = !search ||
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.headline?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const totalInteractions = people.reduce((s: number, p: any) => s + (p.interactionCount || 0), 0)
    const recentCount = people.filter((p: any) => {
        if (!p.lastInteractionAt) return false
        const diff = Date.now() - new Date(p.lastInteractionAt).getTime()
        return diff < 7 * 24 * 60 * 60 * 1000
    }).length

    const filters = [
        { key: 'all', label: 'Todos' },
        { key: 'prospect', label: 'Prospects' },
        { key: 'qualified', label: 'Qualificados' },
        { key: 'customer', label: 'Clientes' },
    ]

    return (
        <div className="flex flex-col gap-6 py-6">
            <PageHeader title="CRM Social" subtitle="Gerencie seus contatos e acompanhe interações">
                <Button variant="accent" className="gap-2">
                    <User size={14} /> Adicionar Contato
                </Button>
            </PageHeader>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard variant="default" label="Total Contatos" value={people.length} icon={<Users size={16} />} />
                <MetricCard variant="dark" label="Interações" value={totalInteractions} icon={<MessageSquare size={16} />} />
                <MetricCard variant="lime" label="Ativos (7d)" value={recentCount} icon={<Activity size={16} />} />
                <MetricCard variant="default" label="Prospects" value={people.filter((p: any) => p.status === 'prospect').length} icon={<User size={16} />} />
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <SearchInput
                    placeholder="Pesquisar contatos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    containerClassName="flex-1 max-w-sm"
                />
                <div className="flex gap-[2px] p-[3px] bg-page rounded-full w-fit">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={cn(
                                'px-4 py-[7px] rounded-full text-[12px] font-semibold transition-all',
                                statusFilter === f.key
                                    ? 'bg-white text-ink shadow-sm'
                                    : 'text-ink-3 hover:text-ink'
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-14 text-center gap-3 border-2 border-dashed border-edge rounded-[var(--r-xl)]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] bg-page mb-1">
                        <User className="h-6 w-6 text-ink-4" />
                    </div>
                    <h3 className="text-[16px] font-bold text-ink">
                        {people.length === 0 ? 'Nenhum contato no CRM' : 'Nenhum resultado encontrado'}
                    </h3>
                    <p className="text-[13px] text-ink-4 max-w-[320px] leading-[1.65]">
                        {people.length === 0
                            ? 'Leads das suas campanhas aparecerão aqui automaticamente.'
                            : 'Tente ajustar o filtro ou a busca.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((person: any) => (
                        <div key={person.id} className="bg-white border border-edge rounded-[var(--r-xl)] p-5 hover:shadow-md transition-all duration-[var(--t-base)] hover:-translate-y-[2px]">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={person.avatarUrl} alt={person.name} />
                                    <AvatarFallback>{person.name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[15px] truncate text-ink">{person.name}</h3>
                                    <p className="text-[12px] text-ink-3 truncate">{person.headline}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant={person.status === 'prospect' ? 'blue' : 'grey'}>
                                            {statusLabels[person.status] || person.status}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px]">
                                            {person.interactionCount} interações
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {person.aiBrief && (
                                <div className="mt-4 p-3 bg-brand-light rounded-[var(--r-md)] text-[12px] border border-brand/10 italic text-brand">
                                    &quot;{person.aiBrief.slice(0, 100)}...&quot;
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-edge gap-2">
                                <div className="text-[10px] text-ink-4">
                                    {person.lastInteractionAt ? (
                                        <>Última interação {formatDistanceToNow(new Date(person.lastInteractionAt), { addSuffix: true, locale: ptBR })}</>
                                    ) : (
                                        <>Aguardando interação</>
                                    )}
                                </div>
                                <Link href={`/crm/${person.id}`}>
                                    <Button size="xs" variant="outline">Ver Detalhes</Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
