"use client";

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Check,
    X,
    Edit2,
    Save,
    MessageSquare,
    Send,
    ExternalLink,
    Loader2,
    Search,
    ChevronLeft,
    AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Lead {
    id: string
    profileName: string
    commentText: string
    commentedAt: string
    status: string
    intentScore: number
    generatedReply: string
    generatedDm: string
    isConnection: boolean
}

export default function LeadsQueuePage() {
    const params = useParams()
    const id = params.id as string
    const router = useRouter()
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [editingLeadId, setEditingLeadId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ reply: '', dm: '' })
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchLeads()
    }, [id])

    const fetchLeads = async () => {
        try {
            const res = await fetch(`/api/campaigns/${id}/leads?status=pending`)
            const data = await res.json()
            setLeads(data.data || [])
        } catch (err) {
            console.error('Erro ao buscar leads', err)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id: string) => {
        setProcessingId(id)
        try {
            const res = await fetch(`/api/leads/${id}/approve`, { method: 'POST' })
            if (res.ok) {
                setLeads(prev => prev.filter(l => l.id !== id))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setProcessingId(null)
        }
    }

    const handleSkip = async (id: string) => {
        setProcessingId(id)
        try {
            const res = await fetch(`/api/leads/${id}/skip`, { method: 'POST' })
            if (res.ok) {
                setLeads(prev => prev.filter(l => l.id !== id))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setProcessingId(null)
        }
    }

    const startEdit = (lead: Lead) => {
        setEditingLeadId(lead.id)
        setEditData({ reply: lead.generatedReply, dm: lead.generatedDm })
    }

    const saveEdit = async (id: string) => {
        setProcessingId(id)
        try {
            const res = await fetch(`/api/leads/${id}/edit`, {
                method: 'PATCH',
                body: JSON.stringify(editData)
            })
            if (res.ok) {
                setLeads(prev => prev.map(l => l.id === id ? { ...l, generatedReply: editData.reply, generatedDm: editData.dm } : l))
                setEditingLeadId(null)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="flex flex-col h-full bg-lf-s2">
            <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl mb-6">
                    <button onClick={() => router.push('/campaigns')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                        <ChevronLeft size={16} /> Voltar para Campanhas
                    </button>
                    <div className="flex border-b border-lf-border pb-6 items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Fila de Aprovação</h1>
                            <p className="text-sm text-muted-foreground mt-1">Leads pendentes aguardando sua revisão</p>
                        </div>
                        <div className="px-3 py-1 bg-lf-accent/10 rounded-full text-xs font-bold text-lf-accent">
                            {leads.length} pendentes
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-lf-accent" size={32} />
                        <span className="lf-caption text-lf-text3">Carregando leads...</span>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="max-w-md text-center py-20 flex flex-col items-center gap-6">
                        <div className="h-16 w-16 bg-white rounded-full border border-lf-border flex items-center justify-center text-lf-text4">
                            <Check size={32} />
                        </div>
                        <div>
                            <h3 className="lf-title text-xl mb-2">Tudo limpo!</h3>
                            <p className="lf-caption text-lf-text3">
                                Não há leads pendentes para aprovação nesta campanha no momento.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/campaigns')}
                            className="px-6 h-10 bg-lf-accent text-white rounded-lg lf-caption font-semibold shadow-md active:scale-95"
                        >
                            Voltar para Campanhas
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl space-y-6">
                        {leads.map(lead => (
                            <div key={lead.id} className="bg-white border border-lf-border rounded-2xl p-6 shadow-sm hover:border-lf-border2 transition-all">
                                {/* Lead Info */}
                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex gap-3">
                                        <div className="h-10 w-10 bg-lf-s1 rounded-full flex items-center justify-center font-bold text-lf-text3 border border-lf-border">
                                            {lead.profileName.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lf-text2 flex items-center gap-2">
                                                {lead.profileName}
                                                {lead.isConnection && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-100 italic">Conexão 1º</span>}
                                            </h4>
                                            <p className="lf-caption text-xs text-lf-text4 mt-0.5">Comentou em {new Date(lead.commentedAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className={cn(
                                            "lf-caption text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                                            lead.intentScore > 70 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                        )}>
                                            Score: {lead.intentScore}
                                        </div>
                                    </div>
                                </div>

                                {/* Comment */}
                                <div className="bg-lf-s1/40 p-3 rounded-lg border-l-4 border-lf-accent mb-6">
                                    <p className="text-xs text-lf-text2 italic">"{lead.commentText}"</p>
                                </div>

                                {/* Actions Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {/* Reply Card */}
                                    <div className="bg-white border border-lf-border rounded-xl p-4 flex flex-col gap-2 relative">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-lf-text4 uppercase tracking-wider mb-1">
                                            <MessageSquare size={14} className="text-lf-accent" /> Resposta IA
                                        </div>
                                        {editingLeadId === lead.id ? (
                                            <textarea
                                                className="w-full h-32 p-2 bg-lf-s1 border border-lf-border rounded-lg text-xs outline-none focus:border-lf-accent resize-none"
                                                value={editData.reply}
                                                onChange={(e) => setEditData(prev => ({ ...prev, reply: e.target.value }))}
                                            />
                                        ) : (
                                            <p className="text-xs text-lf-text3 h-32 overflow-y-auto">{lead.generatedReply}</p>
                                        )}
                                    </div>

                                    {/* DM Card */}
                                    <div className="bg-white border border-lf-border rounded-xl p-4 flex flex-col gap-2 relative">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-lf-text4 uppercase tracking-wider mb-1">
                                            <Send size={14} className="text-lf-accent" /> DM Direct IA
                                        </div>
                                        {editingLeadId === lead.id ? (
                                            <textarea
                                                className="w-full h-32 p-2 bg-lf-s1 border border-lf-border rounded-lg text-xs outline-none focus:border-lf-accent resize-none"
                                                value={editData.dm}
                                                onChange={(e) => setEditData(prev => ({ ...prev, dm: e.target.value }))}
                                            />
                                        ) : (
                                            <p className="text-xs text-lf-text3 h-32 overflow-y-auto">{lead.generatedDm}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Lead Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-lf-border">
                                    <div>
                                        {editingLeadId === lead.id ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveEdit(lead.id)}
                                                    disabled={processingId === lead.id}
                                                    className="h-8 px-4 bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
                                                >
                                                    {processingId === lead.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={14} />}
                                                    Salvar Alterações
                                                </button>
                                                <button
                                                    onClick={() => setEditingLeadId(null)}
                                                    className="h-8 px-4 border border-lf-border rounded-lg text-xs font-bold text-lf-text4 hover:bg-lf-s1 transition-all"
                                                >
                                                    Descartar
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEdit(lead)}
                                                className="h-8 px-4 border border-lf-border rounded-lg text-xs font-bold text-lf-text3 flex items-center gap-1.5 hover:bg-lf-s1 hover:border-lf-border2 transition-all"
                                            >
                                                <Edit2 size={14} /> Personalizar IA
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSkip(lead.id)}
                                            disabled={processingId === lead.id}
                                            className="h-9 px-4 border border-lf-border text-lf-text4 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                                        >
                                            <X size={16} /> Pular
                                        </button>
                                        <button
                                            onClick={() => handleApprove(lead.id)}
                                            disabled={processingId === lead.id || editingLeadId === lead.id}
                                            className="h-9 px-8 bg-lf-accent text-white rounded-xl text-xs font-extrabold flex items-center gap-2 hover:bg-lf-accent/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                        >
                                            {processingId === lead.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                                            Aprovar e Enviar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
