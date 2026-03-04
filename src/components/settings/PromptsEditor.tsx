"use client";

import React, { useState, useRef, } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { motion, AnimatePresence } from 'framer-motion'
import {
    GripVertical,
    RotateCcw,
    Copy,
    Trash2,
    MoreHorizontal,
    Plus,
    Check,
    AlertCircle,
    HelpCircle
} from 'lucide-react'
import { useSettingsStore } from '@/store/settings.store'
import { CommentStyleConfig, CommentStyleId } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

// ─── SORTABLE STYLE CARD ───────────────────────────────────────────────────

interface StyleCardProps {
    style: CommentStyleConfig
    onUpdate: (updates: Partial<CommentStyleConfig>) => void
    onDuplicate: () => void
    onReset: () => void
    onDelete: () => void
    isNew?: boolean
}

function SortableStyleCard({
    style,
    onUpdate,
    onDuplicate,
    onReset,
    onDelete,
    isNew
}: StyleCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: style.id })

    const dndStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    }

    const [prompt, setPrompt] = useState(style.prompt)
    const [isSaving, setIsSaving] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const tokens = Math.ceil(prompt.length / 4)

    const handlePromptChange = (val: string) => {
        setPrompt(val)

        if (timerRef.current) clearTimeout(timerRef.current)

        setIsSaving(true)
        timerRef.current = setTimeout(() => {
            onUpdate({ prompt: val })
            setIsSaving(false)
            toast.success('✓ Salvo', {
                duration: 1500,
                position: 'bottom-center',
                className: 'lf-caption font-bold bg-page border-edge h-8'
            })
        }, 800)
    }

    return (
        <motion.div
            ref={setNodeRef}
            style={dndStyle}
            initial={isNew ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            layout
            className={cn(
                "bg-white border border-edge rounded-[var(--r-xl)] p-[22px_24px] mb-4 transition-all duration-[var(--t-base)] shadow-sm hover:shadow-md",
                isDragging && "opacity-50 scale-[1.01] shadow-xl border-primary/40",
                !style.active && "opacity-60 grayscale-[0.5]"
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 text-ink-4 hover:text-ink transition-colors"
                >
                    <GripVertical size={16} />
                </button>

                <input
                    type="text"
                    value={style.icon}
                    onChange={(e) => onUpdate({ icon: e.target.value.slice(0, 2) })}
                    className="w-12 h-12 flex items-center justify-center bg-page border border-edge rounded-xl lf-title text-center focus:border-ink focus:ring-4 focus:ring-brand/5 outline-none transition-all"
                />

                <div className="flex-1">
                    <input
                        type="text"
                        value={style.label}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                        className="bg-transparent border-none focus:border-none focus:ring-0 outline-none text-[14px] font-bold text-ink w-full transition-all"
                        placeholder="Nome do estilo"
                    />
                    <div className="flex items-center gap-2 mt-0.5">
                        <AnimatePresence mode="wait">
                            {style.active ? (
                                <motion.span
                                    key="active"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="lf-label font-bold text-success-text flex items-center gap-1 uppercase tracking-wider"
                                >
                                    <Check size={10} /> Active
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="inactive"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="lf-label font-bold text-ink-4 uppercase tracking-wider"
                                >
                                    Inactive
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Switch
                        checked={style.active}
                        onCheckedChange={(checked) => onUpdate({ active: checked })}
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-ink-4 hover:text-ink hover:bg-hover rounded-r-sm">
                                <MoreHorizontal size={18} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-edge rounded-r-sm overflow-hidden min-w-[180px]">
                            <DropdownMenuItem onClick={onReset} className="lf-body-sm gap-2.5 cursor-pointer hover:bg-page h-10 flex items-center px-4">
                                <RotateCcw size={14} className="text-brand" /> Restaurar Padrão
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDuplicate} className="lf-body-sm gap-2.5 cursor-pointer hover:bg-page h-10 flex items-center px-4">
                                <Copy size={14} className="text-brand" /> Duplicar Estilo
                            </DropdownMenuItem>
                            <div className="h-px bg-edge my-1" />
                            <DropdownMenuItem onClick={onDelete} className="lf-body-sm gap-2.5 cursor-pointer text-red-400 hover:bg-red-500/10 focus:text-red-400 h-10 flex items-center px-4">
                                <Trash2 size={14} /> Excluir Estilo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Box do Prompt */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <label className="lf-label font-bold text-ink-4 uppercase tracking-widest px-1 border-l border-brand/40">
                        Technical Prompt Integration
                    </label>
                    {isSaving && (
                        <span className="lf-label text-brand animate-pulse font-bold uppercase tracking-widest">Sinc</span>
                    )}
                </div>
                <div className="relative group">
                    <Textarea
                        value={prompt}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        className="bg-page border border-edge rounded-xl p-5 lf-body-sm text-primary font-mono leading-relaxed min-h-[160px] focus:border-ink/50 focus:ring-4 focus:ring-brand/5 resize-none transition-all custom-scrollbar"
                        placeholder="Ex: Escreva uma resposta técnica e analítica..."
                    />
                    <div className="absolute bottom-4 right-4 lf-label font-bold text-ink-4 bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm border border-edge/50">
                        {tokens} tk
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-5 pt-4 border-t border-edge/40 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label className="lf-label text-ink-4 uppercase font-bold block mb-1">Contexto Curto</label>
                    <input
                        type="text"
                        value={style.description}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        placeholder="Ex: Ideal para celebrar vitórias"
                        className="bg-transparent border-none lf-body-sm text-ink-2 placeholder:text-ink-4 w-full outline-none focus:text-ink"
                    />
                </div>
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-page border border-edge rounded-lg">
                    <span className="lf-label text-ink-4 font-bold">PREVIEW:</span>
                    <div className="flex items-center gap-2">
                        <span className="text-base">{style.icon}</span>
                        <span className="lf-body-sm font-bold text-ink">{style.label}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ─── MAIN PROMPTS EDITOR PAGE ────────────────────────────────────────────────

export function PromptsEditor() {
    const styles = useSettingsStore((s) => s.commentStyles)
    const reorderStyles = useSettingsStore((s) => s.reorderStyles)
    const updateStyle = useSettingsStore((s) => s.updateCommentStyle)
    const addStyle = useSettingsStore((s) => s.addCommentStyle)
    const duplicateStyle = useSettingsStore((s) => s.duplicateStyle)
    const resetStyle = useSettingsStore((s) => s.resetStyleToDefault)
    const resetAllStyles = useSettingsStore((s) => s.resetAllStylesToDefault)
    const removeStyle = useSettingsStore((s) => s.removeCommentStyle)

    const [confirmReset, setConfirmReset] = useState(false)
    const [lastAddedId, setLastAddedId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            reorderStyles(active.id as string, over?.id as string)
        }
    }

    const handleAddNew = () => {
        const newId = `custom_${Date.now()}`
        const newStyle: CommentStyleConfig = {
            id: newId as CommentStyleId,
            label: 'Novo Estilo',
            icon: '💬',
            description: 'Personalize como quiser',
            prompt: '',
            active: true,
            order: styles.length
        }
        setLastAddedId(newId)
        addStyle(newStyle)
        toast.success('Estilo criado!')
    }

    const [isMounted, setIsMounted] = useState(false)
    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return null

    return (
        <div className="max-w-4xl mx-auto w-full px-6 py-8">
            {/* Header Página */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 gap-6">
                <div>
                    <h2 className="text-[28px] font-black tracking-[-1px] text-ink">
                        Estilos de Resposta
                    </h2>
                    <p className="text-[13px] font-medium text-ink-4 mt-[5px] max-w-lg">
                        Configure o comportamento tático da IA. Arraste para reordenar a prioridade no feed.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {confirmReset ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg"
                            >
                                <span className="lf-label font-bold text-red-500 uppercase tracking-widest">Tem certeza?</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 lf-label font-bold text-red-500 hover:bg-red-500 hover:text-white rounded-md px-3"
                                    onClick={() => {
                                        resetAllStyles()
                                        setConfirmReset(false)
                                        toast.success('Padrões restaurados')
                                    }}
                                >
                                    Confirmar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 lf-label font-bold text-ink-4 hover:bg-hover rounded-md px-3"
                                    onClick={() => setConfirmReset(false)}
                                >
                                    Cancelar
                                </Button>
                            </motion.div>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={() => setConfirmReset(true)}
                                className="lf-caption text-ink-4 hover:text-red-400 hover:bg-red-400/5 h-10 px-4 rounded-r-sm"
                            >
                                Restaurar Tudo
                            </Button>
                        )}
                    </AnimatePresence>

                    <Button
                        onClick={handleAddNew}
                        variant="accent"
                        size="lg"
                        className="font-bold"
                    >
                        <Plus size={20} className="mr-2" />
                        Novo Estilo
                    </Button>
                </div>
            </div>

            <div className="bg-brand/5 border border-brand/15 rounded-lg p-5 mb-10 flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-500">
                <HelpCircle className="text-brand h-5 w-5 shrink-0 mt-0.5" />
                <div className="lf-body-sm text-ink-2 leading-relaxed">
                    <strong className="text-ink font-bold uppercase tracking-widest text-[11px] mr-2">Tip:</strong>
                    Use <code className="bg-brand/10 px-1.5 py-0.5 rounded text-brand font-mono text-[11px]">{"{postText}"}</code> ou <code className="bg-brand/10 px-1.5 py-0.5 rounded text-brand font-mono text-[11px]">{"{authorName}"}</code> para injeção dinâmica de contexto nos prompts.
                </div>
            </div>

            {/* Lista Sortable */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext
                    items={styles.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col">
                        <AnimatePresence mode="popLayout">
                            {styles.map((style) => (
                                <SortableStyleCard
                                    key={style.id}
                                    style={style}
                                    isNew={style.id === lastAddedId}
                                    onUpdate={(updates) => updateStyle(style.id, updates)}
                                    onDuplicate={() => duplicateStyle(style.id)}
                                    onReset={() => {
                                        resetStyle(style.id)
                                        toast.success('Prompt original restaurado')
                                    }}
                                    onDelete={() => {
                                        removeStyle(style.id)
                                        toast.error('Estilo removido')
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </SortableContext>
            </DndContext>

            {styles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 border border-dashed border-edge rounded-lg opacity-40">
                    <AlertCircle size={40} className="text-ink-4 mb-4" />
                    <p className="lf-subtitle text-ink-4">Nenhum estilo configurado</p>
                    <Button variant="link" onClick={handleAddNew} className="text-brand lf-body-sm font-bold mt-2">Adicionar o primeiro</Button>
                </div>
            )}
        </div>
    )
}
