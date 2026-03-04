"use client";

import React, { useState } from 'react'

import { useRouter } from 'next/navigation'
import {
    ChevronRight,
    ChevronLeft,
    Check,
    Link2,
    Filter,
    Zap,
    Loader2,
    Calendar,
    MessageSquare,
    ThumbsUp,
    Send,
    Target
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Step = 1 | 2 | 3

export default function NewCampaignPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        postUrl: '',
        captureMode: 'any' as 'any' | 'keyword',
        keywords: [] as string[],
        actionLike: true,
        actionReply: false,
        actionDm: true,
        actionInvite: false,
        requireApproval: true,
        windowDays: 7,
        leadMagnetUrl: '',
        leadMagnetLabel: 'Acesse aqui',
        replyTemplate: '',
        dmTemplate: ''
    })

    // Resolved Post State
    const [resolvedPost, setResolvedPost] = useState<any>(null)

    const handleNext = async () => {
        if (step === 1) {
            if (!formData.postUrl) return
            setLoading(true)
            setError(null)
            try {
                const res = await fetch('/api/campaigns/verify-post', {
                    method: 'POST',
                    body: JSON.stringify({ url: formData.postUrl })
                })
                const data = await res.json()
                if (!data.ok) throw new Error(data.error?.message || 'Erro ao validar post')

                setResolvedPost(data.data)
                if (!formData.name) {
                    setFormData(prev => ({ ...prev, name: `Campanha - ${data.data.authorName}` }))
                }
                setStep(2)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        } else if (step === 2) {
            setStep(3)
        } else {
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (!data.ok) throw new Error(data.error?.message || 'Erro ao criar campanha')

            router.push('/campaigns')
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    const stepLabels = ['Alvo', 'Captura', 'Ações']

    return (
        <div className="flex flex-col h-full bg-page">
            <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
                <div className="w-full max-w-2xl mb-6">
                    <button onClick={() => router.push('/campaigns')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                        <ChevronLeft size={16} /> Voltar para Campanhas
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Nova Campanha</h1>
                            <p className="text-sm text-muted-foreground mt-1">Configure seu motor de lead magnet</p>
                        </div>
                    </div>
                </div>
                <div className="w-full max-w-2xl bg-white rounded-2xl border border-edge shadow-sm overflow-hidden mb-12">
                    {/* Stepper Header */}
                    <div className="flex border-b border-edge">
                        {stepLabels.map((label, i) => {
                            const stepNum = i + 1
                            const isActive = step === stepNum
                            const isDone = step > stepNum
                            return (
                                <div
                                    key={label}
                                    className={cn(
                                        "flex-1 h-12 flex items-center justify-center gap-2 border-b-2 transition-all",
                                        isActive ? "border-brand text-brand bg-brand/5" : "border-transparent text-ink-4"
                                    )}
                                >
                                    <div className={cn(
                                        "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
                                        isActive ? "bg-brand text-white border-brand" : (isDone ? "bg-emerald-500 text-white border-emerald-500" : "border-edge")
                                    )}>
                                        {isDone ? <Check size={12} /> : stepNum}
                                    </div>
                                    <span className="text-xs font-semibold">{label}</span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="lf-caption block mb-2 font-semibold">URL do Post no LinkedIn</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4">
                                            <Link2 size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="https://www.linkedin.com/posts/..."
                                            className="w-full h-12 pl-10 pr-4 bg-white border border-edge rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all outline-none"
                                            value={formData.postUrl}
                                            onChange={(e) => setFormData(prev => ({ ...prev, postUrl: e.target.value }))}
                                        />
                                    </div>
                                    <p className="mt-2 text-[11px] text-ink-4">
                                        Dica: Use a URL do post específico para monitorar os comentários.
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, captureMode: 'any' }))}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all text-left group",
                                            formData.captureMode === 'any' ? "border-brand bg-brand/5" : "border-edge hover:border-edge hover:bg-white"
                                        )}
                                    >
                                        <Target className={cn("mb-2", formData.captureMode === 'any' ? "text-brand" : "text-ink-4")} size={24} />
                                        <h4 className="font-semibold text-sm">Qualquer Comentário</h4>
                                        <p className="text-[11px] text-ink-4">Captura todos que comentarem no post.</p>
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, captureMode: 'keyword' }))}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all text-left group",
                                            formData.captureMode === 'keyword' ? "border-brand bg-brand/5" : "border-edge hover:border-edge hover:bg-white"
                                        )}
                                    >
                                        <Filter className={cn("mb-2", formData.captureMode === 'keyword' ? "text-brand" : "text-ink-4")} size={24} />
                                        <h4 className="font-semibold text-sm">Por Palavra-Chave</h4>
                                        <p className="text-[11px] text-ink-4">Captura apenas quem usar termos específicos.</p>
                                    </button>
                                </div>

                                {formData.captureMode === 'keyword' && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                        <label className="lf-caption block mb-2 font-semibold text-xs">Palavras-Chave (separadas por vírgula)</label>
                                        <input
                                            type="text"
                                            placeholder="quero, interesse, manda, me envia"
                                            className="w-full h-11 px-4 bg-white border border-edge rounded-lg outline-none focus:border-brand"
                                            value={formData.keywords.join(', ')}
                                            onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="lf-caption block mb-2 font-semibold text-xs">Janela de Monitoramento (dias)</label>
                                    <div className="flex items-center gap-4">
                                        <Calendar className="text-ink-4" size={20} />
                                        <input
                                            type="range"
                                            min="1"
                                            max="30"
                                            step="1"
                                            className="flex-1 accent-brand"
                                            value={formData.windowDays}
                                            onChange={(e) => setFormData(prev => ({ ...prev, windowDays: parseInt(e.target.value) }))}
                                        />
                                        <span className="w-12 text-center font-bold text-brand bg-brand/10 py-1 rounded-md text-sm">{formData.windowDays}d</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/50 rounded-xl border border-edge flex items-center justify-between">
                                    <div>
                                        <h5 className="font-semibold text-xs">Exigir Aprovação Manual</h5>
                                        <p className="text-[10px] text-ink-4">Revisar leads antes de automatizar as ações.</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, requireApproval: !prev.requireApproval }))}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-all relative",
                                            formData.requireApproval ? "bg-brand" : "bg-edge"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                            formData.requireApproval ? "left-7" : "left-1"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="lf-caption block font-semibold text-xs">Ações Sequenciais</label>

                                    <div onClick={() => setFormData(prev => ({ ...prev, actionLike: !prev.actionLike }))} className="p-3 bg-white/30 border border-edge rounded-lg flex items-center gap-3 cursor-pointer hover:bg-white/50 transition-colors">
                                        <div className={cn("h-5 w-5 rounded border flex items-center justify-center transition-colors", formData.actionLike ? "bg-brand border-brand text-white" : "border-edge bg-white")}>
                                            {formData.actionLike && <Check size={12} strokeWidth={3} />}
                                        </div>
                                        <ThumbsUp size={16} className={formData.actionLike ? "text-brand" : "text-ink-4"} />
                                        <span className="text-xs font-medium">Dar Like no comentário</span>
                                    </div>

                                    <div onClick={() => setFormData(prev => ({ ...prev, actionReply: !prev.actionReply }))} className="p-3 bg-white/30 border border-edge rounded-lg flex items-center gap-3 cursor-pointer hover:bg-white/50 transition-colors">
                                        <div className={cn("h-5 w-5 rounded border flex items-center justify-center transition-colors", formData.actionReply ? "bg-brand border-brand text-white" : "border-edge bg-white")}>
                                            {formData.actionReply && <Check size={12} strokeWidth={3} />}
                                        </div>
                                        <MessageSquare size={16} className={formData.actionReply ? "text-brand" : "text-ink-4"} />
                                        <span className="text-xs font-medium">Responder comentário publicamente</span>
                                    </div>

                                    <div onClick={() => setFormData(prev => ({ ...prev, actionDm: !prev.actionDm }))} className="p-3 bg-white/30 border border-edge rounded-lg flex items-center gap-3 cursor-pointer hover:bg-white/50 transition-colors">
                                        <div className={cn("h-5 w-5 rounded border flex items-center justify-center transition-colors", formData.actionDm ? "bg-brand border-brand text-white" : "border-edge bg-white")}>
                                            {formData.actionDm && <Check size={12} strokeWidth={3} />}
                                        </div>
                                        <Send size={16} className={formData.actionDm ? "text-brand" : "text-ink-4"} />
                                        <span className="text-xs font-medium">Enviar Mensagem Direta (DM)</span>
                                    </div>
                                </div>

                                {formData.actionDm && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
                                        <div>
                                            <label className="lf-caption block mb-2 font-semibold text-xs">Link do Lead Magnet (ex: PDF, Link, Site)</label>
                                            <input
                                                type="text"
                                                className="w-full h-10 px-4 bg-white border border-edge rounded-lg outline-none focus:border-brand text-sm"
                                                placeholder="https://sua-entrega.com/material"
                                                value={formData.leadMagnetUrl}
                                                onChange={(e) => setFormData(prev => ({ ...prev, leadMagnetUrl: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="lf-caption block mb-2 font-semibold text-xs">Texto do Link</label>
                                            <input
                                                type="text"
                                                className="w-full h-10 px-4 bg-white border border-edge rounded-lg outline-none focus:border-brand text-sm"
                                                placeholder="Acesse aqui seu presente"
                                                value={formData.leadMagnetLabel}
                                                onChange={(e) => setFormData(prev => ({ ...prev, leadMagnetLabel: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Nav */}
                    <div className="p-6 bg-white border-t border-edge flex items-center justify-between">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(prev => (prev - 1) as Step)}
                                disabled={loading}
                                className="h-11 px-5 border border-edge rounded-xl lf-caption font-semibold flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50"
                            >
                                <ChevronLeft size={18} />
                                Voltar
                            </button>
                        ) : <div />}

                        <button
                            onClick={handleNext}
                            disabled={loading || (step === 1 && !formData.postUrl)}
                            className="h-11 px-8 bg-brand text-white rounded-xl lf-caption font-semibold flex items-center gap-2 hover:bg-brand/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (step === 3 ? 'Finalizar e Ativar' : 'Próximo')}
                            {!loading && step < 3 && <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>

                {/* Summary Section (Resolving Step 1) */}
                {step === 1 && resolvedPost && (
                    <div className="w-full max-w-2xl bg-white rounded-2xl border border-edge p-6 animate-in fade-in slide-in-from-bottom-4">
                        <h4 className="text-xs font-bold uppercase text-ink-4 mb-4">Post Identificado</h4>
                        <div className="flex gap-4">
                            <div className="h-10 w-10 bg-brand rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                {resolvedPost.authorName.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-sm text-ink-2">{resolvedPost.authorName}</h5>
                                    <span className="text-[10px] text-ink-4">{resolvedPost.publishedAt ? new Date(resolvedPost.publishedAt).toLocaleDateString() : ''}</span>
                                </div>
                                <p className="text-xs text-ink-3 mt-1 line-clamp-3">
                                    {resolvedPost.postText}
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1 text-[10px] text-ink-4">
                                        <MessageSquare size={12} /> {resolvedPost.commentsCount} comentários
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-ink-4">
                                        <ThumbsUp size={12} /> {resolvedPost.likesCount} curtidas
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
