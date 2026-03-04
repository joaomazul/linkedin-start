"use client";

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StylePicker } from './StylePicker'
import { GeneratedOptions } from './GeneratedOptions'
import { ApproveZone } from './ApproveZone'
import { PostedBadge } from './PostedBadge'
import { useGenerateComment } from '@/hooks/useGenerateComment'
import { usePostComment } from '@/hooks/usePostComment'
import { PenLine, Loader2 } from 'lucide-react'

type Stage =
    | 'idle'             // botões "Gerar com IA" + "Manual"
    | 'selecting-style'  // painel com pills de estilos
    | 'generating'       // loading da IA
    | 'reviewing'        // 3 opções geradas para escolher
    | 'approving'        // textarea editável + botão publicar
    | 'posting'          // aguardando resposta do Unipile
    | 'posted'           // badge de sucesso

interface CommentZoneProps {
    post: {
        id: string  // UUID do banco
        linkedinPostId: string
        text: string
        authorName: string
    }
}

export function CommentZone({ post }: CommentZoneProps) {
    const [stage, setStage] = useState<Stage>('idle')
    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
    const [options, setOptions] = useState<string[]>([])
    const [, setSelectedOption] = useState<string>('')
    const [editedText, setEditedText] = useState<string>('')

    const generate = useGenerateComment()
    const postComment = usePostComment()

    // ── Seleciona estilo e dispara geração ────────────────────────────────────
    const handleStyleSelect = useCallback(async (styleId: string) => {
        setSelectedStyleId(styleId)
        setStage('generating')

        try {
            const result = await generate.mutateAsync({
                postText: post.text.slice(0, 2000),
                postAuthor: post.authorName,
                styleId,
            })

            setOptions(result.options)
            setStage('reviewing')
        } catch {
            // O erro já foi tratado no hook (toast)
            setStage('selecting-style')
        }
    }, [post, generate])

    // ── Seleciona uma das opções geradas ─────────────────────────────────────
    const handleOptionSelect = useCallback((option: string) => {
        setSelectedOption(option)
        setEditedText(option)
        setStage('approving')
    }, [])

    // ── Publica o comentário ──────────────────────────────────────────────────
    const handlePublish = useCallback(async () => {
        if (!editedText.trim()) return
        setStage('posting')

        try {
            await postComment.mutateAsync({
                linkedinPostId: post.linkedinPostId,
                text: editedText.trim(),
                styleId: selectedStyleId ?? undefined,
            })
            setStage('posted')
        } catch {
            // Rollback: volta para aprovação com o texto preservado
            setStage('approving')
        }
    }, [editedText, post.linkedinPostId, selectedStyleId, postComment])

    // ── Reset ─────────────────────────────────────────────────────────────────
    const handleReset = useCallback(() => {
        setStage('idle')
        setOptions([])
        setSelectedOption('')
        setEditedText('')
        setSelectedStyleId(null)
    }, [])

    return (
        <div className="px-[22px] pb-[22px] pt-0">
            <AnimatePresence mode="wait">

                {/* ── IDLE: botões iniciais ───────────────────────────────────────── */}
                {stage === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-3"
                    >
                        <button
                            onClick={() => setStage('selecting-style')}
                            className="flex-1 flex items-center justify-center gap-3 rounded-[var(--r-lg)]
                         bg-ink text-white text-[13px] font-bold py-3 px-6
                         hover:bg-brand transition-all active:scale-[0.98]"
                        >
                            <span className="bg-lime text-ink rounded-full px-2 py-0.5 text-[11px] font-extrabold">✦</span>
                            Gerar com IA
                        </button>

                        <button
                            onClick={() => { setEditedText(''); setStage('approving') }}
                            className="flex items-center justify-center gap-2 rounded-[var(--r-lg)]
                         bg-page text-[13px] text-ink-3 font-bold
                         py-3 px-6 hover:bg-ink hover:text-white transition-all active:scale-[0.98]"
                        >
                            <PenLine className="h-3.5 w-3.5" />
                            Manual
                        </button>
                    </motion.div>
                )}

                {/* ── SELECTING STYLE: painel de estilos ─────────────────────────── */}
                {stage === 'selecting-style' && (
                    <motion.div
                        key="selecting-style"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                    >
                        <StylePicker
                            onSelect={handleStyleSelect}
                            onCancel={handleReset}
                        />
                    </motion.div>
                )}

                {/* ── GENERATING: loading ─────────────────────────────────────────── */}
                {stage === 'generating' && (
                    <motion.div
                        key="generating"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-3 py-6"
                    >
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                        <p className="text-sm text-muted-foreground">
                            Analisando o post e gerando opções...
                        </p>
                    </motion.div>
                )}

                {/* ── REVIEWING: 3 opções geradas ─────────────────────────────────── */}
                {stage === 'reviewing' && (
                    <motion.div
                        key="reviewing"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                    >
                        <GeneratedOptions
                            options={options}
                            onSelect={handleOptionSelect}
                            onRegenerate={() => selectedStyleId && handleStyleSelect(selectedStyleId)}
                            onCancel={handleReset}
                            isRegenerating={generate.isPending}
                        />
                    </motion.div>
                )}

                {/* ── APPROVING: editar e publicar ────────────────────────────────── */}
                {(stage === 'approving' || stage === 'posting') && (
                    <motion.div
                        key="approving"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                    >
                        <ApproveZone
                            value={editedText}
                            onChange={setEditedText}
                            onPublish={handlePublish}
                            onBack={() => options.length > 0 ? setStage('reviewing') : handleReset()}
                            isPublishing={stage === 'posting'}
                        />
                    </motion.div>
                )}

                {/* ── POSTED: badge de sucesso ─────────────────────────────────────── */}
                {stage === 'posted' && (
                    <motion.div
                        key="posted"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <PostedBadge onReset={handleReset} />
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    )
}
