"use client";

import React, { useState, useMemo } from 'react'
import { useSettingsStore } from '@/store/settings.store'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { buildPersonaPrompt } from '@/lib/utils/prompts'
import { useGenerateComment } from '@/hooks/useGenerateComment'
import {
    User,
    Briefcase,
    Target,
    ShieldAlert,
    Sparkles,
    Loader2,
    CheckCircle2,
    Info,
} from 'lucide-react'
import { motion, } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const EXAMPLE_POST = {
    text: "Acabamos de lançar nossa nova rodada de investimento focada em expansão para o mercado Europeu. O desafio é grande, mas o time está pronto!",
    author: "Ricardo Santos",
    role: "CEO na GlobalScale"
}

interface PersonaEditorProps {
    onboarding?: boolean
}

export function PersonaEditor({ onboarding = false }: PersonaEditorProps) {
    const persona = useSettingsStore((s) => s.persona)
    const updatePersona = useSettingsStore((s) => s.updatePersona)
    const generate = useGenerateComment()
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [previewComment, setPreviewComment] = useState('')

    const handleUpdate = (field: keyof typeof persona, value: string) => {
        updatePersona({ [field]: value })
    }

    const fullPrompt = useMemo(() => buildPersonaPrompt(persona), [persona])

    const fields = ['name', 'role', 'company', 'niche', 'tone', 'goals', 'avoid', 'customPrompt'] as const
    const filledCount = fields.filter(f => persona[f] && persona[f].trim().length > 0).length
    const completeness = (filledCount / fields.length) * 100

    const handlePreviewComment = async () => {
        setIsPreviewing(true)
        try {
            const result = await generate.mutateAsync({
                postText: EXAMPLE_POST.text,
                postAuthor: EXAMPLE_POST.author,
                styleId: 'valor', // Needs to be a valid uuid ideally, but mock is ok here since it will fail api call anyway unless value exists
            })
            if (result.options?.[0]) {
                setPreviewComment(result.options[0])
            }
        } catch (err: unknown) {
            console.error(err)
            toast.error('Erro ao gerar preview')
        } finally {
            setIsPreviewing(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto w-full px-6 py-8">
            <div className="flex flex-col lg:flex-row gap-12">

                {/* COLUNA ESQUERDA: FORMULÁRIO */}
                <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                    {!onboarding && (
                        <div>
                            <h2 className="text-[28px] font-black tracking-[-1px] text-ink">
                                Identidade IA
                            </h2>
                            <p className="text-[13px] font-medium text-ink-4 mt-[5px] max-w-lg">
                                Refine sua persona para que a IA escreva exatamente como você pensaria.
                            </p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <FormSection title="Identidade" icon={<User size={16} />}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                    <Label className="t-label text-ink-4 ml-1">Nome</Label>
                                    <Input
                                        value={persona.name}
                                        onChange={e => handleUpdate('name', e.target.value)}
                                        placeholder="Seu nome"
                                        className="bg-page border-edge rounded-lg h-11 t-body-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="t-label text-ink-4 ml-1">Cargo</Label>
                                    <Input
                                        value={persona.role}
                                        onChange={e => handleUpdate('role', e.target.value)}
                                        placeholder="Ex: Head of Growth"
                                        className="bg-page border-edge rounded-lg h-11 t-body-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="t-label text-ink-4 ml-1">Empresa</Label>
                                    <Input
                                        value={persona.company}
                                        onChange={e => handleUpdate('company', e.target.value)}
                                        placeholder="Nome da empresa"
                                        className="bg-page border-edge rounded-lg h-11 t-body-sm"
                                    />
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Contexto Profissional" icon={<Briefcase size={16} />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="t-label text-ink-4 ml-1">Nicho / Área de Atuação</Label>
                                    <Input
                                        value={persona.niche}
                                        onChange={e => handleUpdate('niche', e.target.value)}
                                        placeholder="ex: SaaS B2B, Finanças"
                                        className="bg-page border-edge rounded-lg h-11 t-body-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="t-label text-ink-4 ml-1">Tom de Voz</Label>
                                    <Input
                                        value={persona.tone}
                                        onChange={e => handleUpdate('tone', e.target.value)}
                                        placeholder="ex: Analítico, Próximo, Criativo"
                                        className="bg-page border-edge rounded-lg h-11 t-body-sm"
                                    />
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Estratégia e Regras" icon={<Target size={16} />}>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="t-label text-ink-4 ml-1">Principais Objetivos</Label>
                                    <Textarea
                                        value={persona.goals}
                                        onChange={e => handleUpdate('goals', e.target.value)}
                                        placeholder="O que você deseja alcançar com seus comentários?"
                                        className="bg-page border-edge rounded-lg min-h-[100px] resize-none t-body-sm p-4 custom-scrollbar"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="t-label text-ink-4 ml-1 flex items-center gap-1.5">
                                        <ShieldAlert size={12} className="text-red-400" />
                                        Restrições (O que evitar)
                                    </Label>
                                    <Textarea
                                        value={persona.avoid}
                                        onChange={e => handleUpdate('avoid', e.target.value)}
                                        placeholder="Ex: Clichês, excesso de emojis, tom agressivo..."
                                        className="bg-page border-edge rounded-lg min-h-[80px] resize-none t-body-sm p-4 custom-scrollbar"
                                    />
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Instruções Expert" icon={<Sparkles size={16} />} badge="Advanced">
                            <div className="space-y-3">
                                <Textarea
                                    value={persona.customPrompt}
                                    onChange={e => handleUpdate('customPrompt', e.target.value)}
                                    placeholder="Regras específicas de escrita, referências ou bordões..."
                                    className="bg-page border-edge rounded-lg min-h-[140px] resize-none t-body-sm p-4 custom-scrollbar"
                                />
                                <div className="flex items-center gap-2 p-3 rounded-md bg-brand/5 border border-brand/10">
                                    <Info size={14} className="text-brand shrink-0" />
                                    <p className="t-caption text-ink-4">
                                        Ex: &quot;Cite minha experiência com startups de IA&quot; ou &quot;Use analogias náuticas&quot;.
                                    </p>
                                </div>
                            </div>
                        </FormSection>

                        <div className="pt-8">
                            <Button
                                variant="accent"
                                size="lg"
                                className="font-bold min-w-[240px]"
                                onClick={() => toast.success('Perfil salvo localmente!')}
                            >
                                <CheckCircle2 size={20} className="mr-2" />
                                Atualizar Perfil IA
                            </Button>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: PREVIEW AO VIVO */}
                <div className="w-full lg:w-[420px] shrink-0">
                    <div className={cn("sticky space-y-6 animate-in fade-in duration-500 delay-200", !onboarding && "top-24")}>

                        {/* Box do Prompt */}
                        <div className="rounded-[var(--r-xl)] border border-edge bg-white p-8 relative overflow-hidden shadow-md">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 rounded-full bg-primary" />
                                    <h3 className="t-title text-ink">Prompt Gerado</h3>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-lime/20 border border-lime/30">
                                    <div className="h-1.5 w-1.5 rounded-full bg-ink animate-pulse" />
                                    <span className="t-label text-ink font-bold uppercase tracking-wider">Live</span>
                                </div>
                            </div>

                            <div className="bg-page rounded-xl border border-primary/10 p-6 font-mono text-[11px] leading-relaxed text-primary/80 min-h-[240px] max-h-[460px] overflow-y-auto custom-scrollbar shadow-inner select-all">
                                {fullPrompt || <span className="text-ink-4 opacity-50 italic">Construindo sua identidade técnica...</span>}
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center justify-between t-label font-bold text-ink-4 uppercase tracking-wider">
                                    <span>Nível de Detalhe</span>
                                    <span className="text-ink-2 font-bold">{filledCount}/8 campos</span>
                                </div>
                                <div className="h-2 w-full bg-hover rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completeness}%` }}
                                        className="h-full bg-primary shadow-lg shadow-primary/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Teste de Geração */}
                        <div className="rounded-[var(--r-xl)] border border-edge bg-white p-8 shadow-md">
                            <h4 className="t-title text-ink mb-6">Teste de Geração</h4>
                            <div className="bg-page p-5 rounded-xl border border-edge mb-6">
                                <p className="t-label text-ink-4 uppercase font-bold mb-2">{EXAMPLE_POST.author}</p>
                                <p className="t-body-sm text-ink-2 leading-relaxed italic">
                                    &quot;{EXAMPLE_POST.text}&quot;
                                </p>
                            </div>

                            {previewComment && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mb-6 p-5 rounded-xl bg-primary/5 border border-primary/20 border-dashed"
                                >
                                    <p className="t-label font-bold text-primary uppercase mb-2">Comentário Simulador:</p>
                                    <p className="t-body-sm text-ink whitespace-pre-wrap leading-relaxed">
                                        {previewComment}
                                    </p>
                                </motion.div>
                            )}

                            <Button
                                variant="outline"
                                onClick={handlePreviewComment}
                                disabled={isPreviewing || filledCount < 3}
                                className="w-full text-ink-3 hover:text-primary transition-all rounded-xl"
                            >
                                {isPreviewing ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
                                {filledCount < 3 ? 'Preencha mais campos' : 'Gerar Preview (1 cr.)'}
                            </Button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}

function FormSection({ title, icon, badge, children }: {
    title: string,
    icon: React.ReactNode,
    badge?: string,
    children: React.ReactNode
}) {
    return (
        <section className="bg-white border border-edge rounded-[var(--r-xl)] p-[22px_24px] shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-[30px] w-[30px] rounded-[var(--r-sm)] bg-brand/10 flex items-center justify-center text-brand">
                        {icon}
                    </div>
                    <h3 className="text-[14px] font-bold text-ink">{title}</h3>
                </div>
                {badge && (
                    <span className="bg-brand/10 text-brand t-label font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-brand/20">
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </section>
    )
}
