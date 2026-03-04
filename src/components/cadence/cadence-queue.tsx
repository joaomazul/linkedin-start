"use client";


import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Check, Clipboard, Send, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CadenceQueue({ initialSuggestions }: { initialSuggestions: any[] }) {
    const [suggestions, setSuggestions] = useState(initialSuggestions)
    const [loading, setLoading] = useState<string | null>(null)

    const handleDismiss = async (id: string) => {
        setLoading(id)
        try {
            const res = await fetch(`/api/cadence/queue/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Falha ao descartar')
            setSuggestions(suggestions.filter(s => s.suggestion.id !== id))
            toast.info('Sugestão descartada')
        } catch (error) {
            toast.error('Erro ao descartar sugestão')
        } finally {
            setLoading(null)
        }
    }

    const handleExecute = async (sugWrapper: any, action: 'execute' | 'manual') => {
        const { suggestion, personId } = sugWrapper
        setLoading(suggestion.id)

        try {
            const res = await fetch(`/api/cadence/queue/${suggestion.id}`, {
                method: 'POST',
                body: JSON.stringify({
                    action,
                    personId,
                    content: (document.getElementById(`content-${suggestion.id}`) as HTMLTextAreaElement)?.value || suggestion.suggestedContent
                })
            })

            const data = await res.json()
            if (!data.ok) throw new Error(data.error?.message || 'Falha na execução')

            setSuggestions(suggestions.filter(s => s.suggestion.id !== suggestion.id))
            toast.success(action === 'execute' ? 'Ação executada e registrada no CRM' : 'Interação registrada no CRM')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(null)
        }
    }

    if (suggestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center border rounded-xl bg-muted/5">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium">Tudo em dia!</h3>
                <p className="text-muted-foreground mt-2">Você não tem sugestões de cadência pendentes no momento.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {suggestions.map((sug) => {
                const { suggestion, personName, personAvatar, personHeadline } = sug
                const isPending = suggestion.status === 'pending'
                const urgency = suggestion.urgencyScore || 50

                return (
                    <Card key={suggestion.id} className={cn("overflow-hidden border-l-4 transition-all", isPending ? "border-l-primary" : "border-l-muted")}>
                        <CardHeader className="p-4 pb-0">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={personAvatar} />
                                        <AvatarFallback>{personName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-semibold text-sm">{personName}</h4>
                                        <p className="text-xs text-muted-foreground">{personHeadline}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {isPending && (
                                        <div className="hidden sm:block">
                                            {urgency > 70 ? (
                                                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] uppercase shadow-sm">🔴 Alta Prioridade</Badge>
                                            ) : urgency > 40 ? (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] uppercase shadow-sm">🟡 Média</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] uppercase shadow-sm">🟢 Baixa</Badge>
                                            )}
                                        </div>
                                    )}
                                    {isPending ? (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                                            onClick={() => handleDismiss(suggestion.id)}
                                            disabled={loading === suggestion.id}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium bg-muted/50 px-2 py-1 rounded-md">
                                            <Clock size={12} />
                                            {new Date(suggestion.updatedAt || suggestion.createdAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-4">
                            <div className="bg-muted/30 p-4 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="bg-background">{suggestion.type.toUpperCase()}</Badge>
                                    <span className="text-xs font-medium text-primary">IA Suggestion</span>
                                </div>
                                <p className="text-sm font-medium mb-2">{suggestion.reason}</p>

                                {isPending ? (
                                    <>
                                        <Textarea
                                            id={`content-${suggestion.id}`}
                                            defaultValue={suggestion.suggestedContent}
                                            className="text-sm min-h-[100px] bg-background mt-4 focus:border-ink/50"
                                        />

                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2 text-xs"
                                                onClick={() => handleExecute(sug, 'manual')}
                                                disabled={loading === suggestion.id}
                                            >
                                                Registrar Apenas
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2 text-xs"
                                                onClick={() => {
                                                    const val = (document.getElementById(`content-${suggestion.id}`) as HTMLTextAreaElement)?.value || suggestion.suggestedContent
                                                    navigator.clipboard.writeText(val)
                                                    toast.success('Copiado!')
                                                }}
                                            >
                                                <Clipboard className="h-3.5 w-3.5" /> Copiar
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="gap-2 text-xs font-semibold shadow-sm active:scale-95 transition-all"
                                                onClick={() => handleExecute(sug, 'execute')}
                                                disabled={loading === suggestion.id}
                                            >
                                                <Send className="h-3.5 w-3.5" /> {loading === suggestion.id ? 'Executando...' : 'Executar & LinkedIn'}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-4 opacity-70">
                                        <p className="text-xs text-muted-foreground mb-1 font-semibold">{suggestion.status === 'done' ? 'Executado:' : 'Ignorado:'}</p>
                                        <div className="text-sm p-3 bg-background border rounded-md whitespace-pre-wrap">
                                            {suggestion.suggestedContent}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
