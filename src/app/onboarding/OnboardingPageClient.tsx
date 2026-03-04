"use client";

import React, { useState, useEffect } from 'react'

import { useSettingsStore } from '@/store/settings.store'
import { useProfilesStore } from '@/store/profiles.store'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronRight,
    ArrowLeft,
    Linkedin,
    UserPlus,
    Sparkles,
} from 'lucide-react'
import { AccountSettings } from '@/components/settings/AccountSettings'
import { AddProfileModal } from '@/components/profiles/AddProfileModal'
import { PersonaEditor } from '@/components/settings/PersonaEditor'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type OnboardingStep = 1 | 2 | 3

export default function OnboardingPage() {
    const [step, setStep] = useState<OnboardingStep>(1)
    const linkedinAccountId = useSettingsStore(s => s.linkedinAccountId)
    const profiles = useProfilesStore(s => s.profiles)
    const router = useRouter()

    useEffect(() => {
        // Se já está integrado via ENV ou Store, e estamos no step 1, podemos tentar avançar
        if (linkedinAccountId && step === 1) {
            setTimeout(() => setStep(2), 0)
        }
    }, [linkedinAccountId, step])

    const nextStep = () => {
        if (step === 1 && !linkedinAccountId) {
            toast.error('Vincule uma conta LinkedIn primeiro')
            return
        }
        if (step === 2 && profiles.length === 0) {
            toast.error('Adicione pelo menos um perfil para monitorar')
            return
        }
        if (step < 3) setStep((step + 1) as OnboardingStep)
        else router.push('/feed')
    }

    const prevStep = () => {
        if (step > 1) setStep((step - 1) as OnboardingStep)
    }

    return (
        <div className="min-h-screen bg-page flex flex-col items-center justify-center p-8 relative overflow-hidden">

            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-brand/5 blur-[160px] rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-brand/5 blur-[140px] rounded-full translate-x-1/2 translate-y-1/2" />

            {/* Progress Bar */}
            <div className="max-w-md w-full mb-16 flex items-center gap-2.5 px-12 relative z-10">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1">
                        <div className={cn(
                            "h-1 rounded-full transition-all duration-700 ease-out",
                            step >= i ? "bg-brand shadow-accent" : "bg-hover"
                        )} />
                    </div>
                ))}
            </div>

            <div className="max-w-5xl w-full relative z-10">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="flex flex-col items-center"
                        >
                            <StepHeader
                                icon={<Linkedin size={28} />}
                                title="Sincronize sua conta"
                                description="Conecte seu LinkedIn via Unipile para que possamos monitorar seu feed e sugerir comentários de alto impacto."
                            />
                            <div className="w-full max-w-2xl bg-white rounded-lg border border-edge p-3 mt-10 shadow-2xl shadow-black/50">
                                <AccountSettings />
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="flex flex-col items-center"
                        >
                            <StepHeader
                                icon={<UserPlus size={28} />}
                                title="Conexões Estratégicas"
                                description="Adicione os perfis que você deseja monitorar. Cada postagem deles será uma oportunidade de interação."
                            />
                            <div className="w-full max-w-xl bg-white rounded-lg border border-edge p-12 mt-10 text-center shadow-2xl shadow-black/50">
                                <div className="mb-8 space-y-2">
                                    <p className="text-[14px] font-bold text-ink">Alvos de Monitoramento</p>
                                    <p className="lf-body-sm text-ink-3">Você configurou <span className="text-brand font-bold">{profiles.length}</span> perfis até agora.</p>
                                </div>
                                <AddProfileModal inline open={true} onClose={() => { }} />
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="flex flex-col items-center"
                        >
                            <StepHeader
                                icon={<Sparkles size={28} />}
                                title="Treine sua Persona"
                                description="Conte para a IA como você escreve. Isso garante que as sugestões sejam indistinguíveis de um comentário real seu."
                            />
                            <div className="w-full max-w-6xl bg-white rounded-lg border border-edge mt-10 overflow-hidden shadow-2xl shadow-black/50">
                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    <PersonaEditor onboarding />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="mt-16 flex items-center justify-center gap-5">
                    {step > 1 && (
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            className="h-12 px-10 text-[13px] text-ink-4 hover:text-ink hover:bg-hover rounded-r-sm transition-all"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Voltar
                        </Button>
                    )}
                    <Button
                        onClick={nextStep}
                        className="h-12 px-12 bg-brand hover:bg-brand-dark text-white lf-subtitle font-bold rounded-lg shadow-accent border-none transition-all group"
                    >
                        {step === 3 ? 'Finalizar Setup' : 'Próximo Passo'}
                        <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function StepHeader({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="text-center max-w-xl space-y-4">
            <div className="h-14 w-14 rounded-r-sm bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto mb-4">
                {icon}
            </div>
            <h1 className="text-[15px] font-bold text-ink text-4xl">{title}</h1>
            <p className="lf-body text-ink-3 leading-relaxed">{description}</p>
        </div>
    )
}
