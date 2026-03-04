"use client";

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
    X, Search, Loader2, UserPlus,
    Users, MapPin, CheckCircle2, AlertCircle,
    LayoutList, Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import { useProfilesStore } from '@/store/profiles.store'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ResolvedProfile {
    providerId: string
    publicIdentifier: string
    name: string
    headline: string
    avatarUrl: string | null
    followerCount: number
    location: string
}

type ModalTab = 'single' | 'batch' | 'group'
type ModalStage = 'input' | 'loading' | 'preview' | 'saving' | 'success'

interface AddProfileModalProps {
    open?: boolean
    onClose?: () => void
    inline?: boolean
    defaultGroupId?: string
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function AddProfileModal({ open, onClose, inline, defaultGroupId }: AddProfileModalProps) {
    const queryClient = useQueryClient()
    const inputRef = useRef<HTMLInputElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const [activeTab, setActiveTab] = useState<ModalTab>('single')
    const [stage, setStage] = useState<ModalStage>('input')
    const [url, setUrl] = useState('')
    const [batchUrls, setBatchUrls] = useState('')
    const [groupName, setGroupName] = useState('')
    const [selectedGroupId, setSelectedGroupId] = useState<string>(defaultGroupId || '')
    const [profile, setProfile] = useState<ResolvedProfile | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (defaultGroupId) setSelectedGroupId(defaultGroupId)
    }, [defaultGroupId])

    const groups = useProfilesStore((s) => s.groups)
    const addGroupToStore = useProfilesStore((s) => s.addGroup)

    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    // ── Fecha e reseta ──────────────────────────────────────────────────────
    const handleClose = useCallback(() => {
        if (stage === 'saving') return
        setStage('input')
        setUrl('')
        setBatchUrls('')
        setGroupName('')
        setProfile(null)
        setError(null)
        if (onClose) onClose()
    }, [stage, onClose])

    // ── Busca preview do perfil ─────────────────────────────────────────────
    const handleSearch = useCallback(async () => {
        const trimmed = url.trim()
        if (!trimmed) {
            setError('Cole a URL do perfil LinkedIn')
            inputRef.current?.focus()
            return
        }

        setError(null)
        setStage('loading')

        try {
            const encoded = encodeURIComponent(trimmed)
            const res = await fetch(`/api/linkedin/profiles/preview?url=${encoded}`)
            const data = await res.json()

            if (!res.ok || !data.ok) {
                throw new Error(data?.error?.message ?? 'Perfil não encontrado')
            }

            setProfile(data.data)
            setStage('preview')
        } catch (err) {
            setError((err as Error).message || 'Erro ao buscar perfil. Tente novamente.')
            setStage('input')
        }
    }, [url])

    // ── Salva Grupo ─────────────────────────────────────────────────────────
    const handleSaveGroup = async () => {
        if (!groupName.trim()) {
            setError('Nome do grupo é obrigatório')
            return
        }
        setStage('saving')
        try {
            const res = await fetch('/api/linkedin/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: groupName.trim() }),
            })
            const data = await res.json()
            if (!res.ok || !data.ok) throw new Error(data?.error?.message || 'Erro ao criar grupo')

            addGroupToStore(data.data)
            toast.success('Grupo criado com sucesso!')
            setStage('success')
            setTimeout(() => handleClose(), 1000)
        } catch (err) {
            setError((err as Error).message)
            setStage('input')
        }
    }

    // ── Salva em Lote ───────────────────────────────────────────────────────
    const handleSaveBatch = async () => {
        const urls = batchUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0)
        if (urls.length === 0) {
            setError('Insira ao menos uma URL')
            return
        }
        setStage('saving')
        try {
            const res = await fetch('/api/linkedin/profiles/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls, groupId: selectedGroupId || undefined }),
            })
            const data = await res.json()
            if (!res.ok || !data.ok) throw new Error(data?.error?.message || 'Erro na importação')

            toast.success(`${data.data.createdCount} perfis adicionados!`)
            queryClient.invalidateQueries({ queryKey: ['monitored-profiles'] })
            setStage('success')
            setTimeout(() => handleClose(), 1500)
        } catch (err) {
            setError((err as Error).message)
            setStage('input')
        }
    }

    const handleConfirm = useCallback(async () => {
        if (!profile) return
        setStage('saving')
        try {
            const res = await fetch('/api/linkedin/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    linkedinUrl: url.trim(),
                    groupId: selectedGroupId || undefined,
                    _resolved: profile,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? 'Erro ao adicionar perfil')
            setStage('success')
            queryClient.invalidateQueries({ queryKey: ['monitored-profiles'] })
            queryClient.invalidateQueries({ queryKey: ['feed'] })
            toast.success(`${profile.name} adicionado!`)
            setTimeout(() => handleClose(), 1500)
        } catch (err) {
            toast.error((err as Error).message)
            setStage('preview')
        }
    }, [profile, url, selectedGroupId, queryClient, handleClose])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && activeTab === 'single') handleSearch()
    }, [handleSearch, activeTab])

    if (!mounted && !inline) return null

    const renderContent = () => (
        <motion.div
            key="modal-content"
            className={cn(
                "w-full max-w-lg mx-auto rounded-3xl border border-edge bg-white shadow-2xl overflow-hidden flex flex-col transition-colors",
                inline ? "shadow-none border-none" : ""
            )}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="px-6 py-5 border-b border-edge flex items-center justify-between">
                <div>
                    <h2 className="t-heading text-ink leading-tight">Configurar Gerenciamento</h2>
                    <p className="t-caption text-ink-3 mt-0.5">Organize perfis e grupos para o feed.</p>
                </div>
                {!inline && (
                    <button onClick={handleClose} className="p-2 hover:bg-page rounded-full text-ink-4">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Tabs */}
            {stage === 'input' && (
                <div className="px-6 pt-4 flex gap-4 border-b border-edge">
                    <TabButton active={activeTab === 'single'} onClick={() => { setActiveTab('single'); setError(null) }} label="Perfil" icon={<UserPlus size={14} />} />
                    <TabButton active={activeTab === 'batch'} onClick={() => { setActiveTab('batch'); setError(null) }} label="Lote (CSV)" icon={<LayoutList size={14} />} />
                    <TabButton active={activeTab === 'group'} onClick={() => { setActiveTab('group'); setError(null) }} label="Criar Grupo" icon={<Users size={14} />} />
                </div>
            )}

            <div className="p-6">
                {(stage === 'input' || stage === 'loading' || stage === 'saving') && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        {activeTab === 'single' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="t-label text-ink-4">URL LinkedIn</label>
                                    <div className="flex gap-2">
                                        <input
                                            ref={inputRef}
                                            value={url}
                                            onChange={e => { setUrl(e.target.value); setError(null) }}
                                            onKeyDown={handleKeyDown}
                                            placeholder="linkedin.com/in/usuario"
                                            className="flex-1 bg-page border border-edge rounded-xl px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand/20 outline-none transition-all"
                                        />
                                        <button
                                            onClick={handleSearch}
                                            disabled={stage === 'loading' || !url.trim()}
                                            className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-bold t-subtitle flex items-center gap-2 disabled:opacity-50 transition-all"
                                        >
                                            {stage === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                            Buscar
                                        </button>
                                    </div>
                                </div>

                                {groups.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="t-label text-ink-4">Grupo (Opcional)</label>
                                        <select
                                            value={selectedGroupId}
                                            onChange={e => setSelectedGroupId(e.target.value)}
                                            className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm outline-none appearance-none"
                                        >
                                            <option value="">Nenhum grupo (Fica na raiz)</option>
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'batch' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="t-label text-ink-4">Lista de URLs (Uma por linha)</label>
                                    <textarea
                                        ref={textAreaRef}
                                        value={batchUrls}
                                        onChange={e => { setBatchUrls(e.target.value); setError(null) }}
                                        placeholder="Ex:&#10;https://www.linkedin.com/in/perfil1&#10;https://www.linkedin.com/in/perfil2"
                                        className="w-full h-32 bg-page border border-edge rounded-xl px-4 py-3 text-sm focus:border-brand outline-none transition-all resize-none"
                                    />
                                    <p className="t-caption text-ink-4 italic">Dica: Você pode colar colunas de um CSV ou Excel aqui.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="t-label text-ink-4">Grupo de Destino</label>
                                    <select
                                        value={selectedGroupId}
                                        onChange={e => setSelectedGroupId(e.target.value)}
                                        className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm outline-none"
                                    >
                                        <option value="">Nenhum grupo</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>

                                <button
                                    onClick={handleSaveBatch}
                                    disabled={stage === 'saving' || !batchUrls.trim()}
                                    className="w-full bg-brand hover:bg-brand-dark text-white h-[44px] rounded-xl font-bold t-subtitle flex items-center justify-center gap-2 transition-all mt-4"
                                >
                                    {stage === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                                    Importar tudo agora
                                </button>
                            </div>
                        )}

                        {activeTab === 'group' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="t-label text-ink-4">Nome do Grupo</label>
                                    <input
                                        value={groupName}
                                        onChange={e => { setGroupName(e.target.value); setError(null) }}
                                        placeholder="Ex: Investidores, Tech Leads, Leads Frios"
                                        className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm focus:border-brand outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleSaveGroup}
                                    disabled={stage === 'saving' || !groupName.trim()}
                                    className="w-full bg-brand hover:bg-brand-dark text-white h-[44px] rounded-xl font-bold t-subtitle flex items-center justify-center gap-2 transition-all"
                                >
                                    {stage === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    Criar Grupo
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-danger-text/5 border border-danger-text/20 rounded-xl text-danger-text t-caption">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Preview Stage */}
                {(stage === 'preview' || stage === 'saving') && profile && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-4 p-5 rounded-[var(--r-xl)] bg-page border border-edge">
                            <div className="h-20 w-20 rounded-[var(--r-xl)] overflow-hidden border-2 border-edge shrink-0">
                                {profile.avatarUrl ? (
                                    <Image src={profile.avatarUrl} alt={profile.name} width={80} height={80} className="object-cover h-full w-full" unoptimized />
                                ) : (
                                    <div className="w-full h-full bg-brand/10 flex items-center justify-center text-brand font-bold text-2xl">{profile.name[0]}</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="t-heading text-ink truncate">{profile.name}</h3>
                                <p className="t-body text-ink-3 line-clamp-2 mt-1">{profile.headline}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="flex items-center gap-1.5 t-caption text-ink-3">
                                        <Users size={12} className="text-brand" />
                                        {profile.followerCount.toLocaleString()} seguidores
                                    </span>
                                    {profile.location && (
                                        <span className="flex items-center gap-1.5 t-caption text-ink-3">
                                            <MapPin size={12} className="text-brand" />
                                            {profile.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleConfirm}
                                disabled={stage === 'saving'}
                                className="w-full h-[48px] bg-brand hover:bg-brand-dark text-white rounded-xl font-bold t-title flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20"
                            >
                                {stage === 'saving' ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                Confirmar e Adicionar
                            </button>
                            <button
                                onClick={() => setStage('input')}
                                disabled={stage === 'saving'}
                                className="w-full py-2 t-caption text-ink-4 hover:text-ink transition-colors"
                            >
                                Voltar e corrigir
                            </button>
                        </div>
                    </div>
                )}

                {/* Success Stage */}
                {stage === 'success' && (
                    <div className="py-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <div className="h-20 w-20 rounded-full bg-success-text/10 flex items-center justify-center text-success-text mb-4">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="t-heading text-ink">Pronto!</h3>
                        <p className="t-body text-ink-3 mt-1">Procedimento realizado com sucesso.</p>
                    </div>
                )}
            </div>
        </motion.div>
    )

    if (inline) {
        return renderContent()
    }

    return mounted ? createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-white/20 backdrop-blur-md"
                    onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose() }}
                >
                    {renderContent()}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    ) : null
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-1 pb-3 t-subtitle transition-all relative",
                active ? "text-brand" : "text-ink-4 hover:text-ink-3"
            )}
        >
            {icon}
            {label}
            {active && (
                <motion.div layoutId="active-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
        </button>
    )
}
