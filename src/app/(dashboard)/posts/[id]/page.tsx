"use client";

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Rocket, Share2, Sparkles, MessageSquare, ThumbsUp, Repeat2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'

export default function PostEditorPage() {
    const params = useParams()
    const id = params.id as string
    const router = useRouter()
    const [post, setPost] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [editorContent, setEditorContent] = useState('')

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/posts/${id}`)
                const data = await res.json()
                if (data.ok) {
                    setPost(data.data)
                    setEditorContent(data.data.body)
                }
            } catch (err) {
                toast.error('Erro ao carregar post')
            } finally {
                setLoading(false)
            }
        }
        fetchPost()
    }, [id])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: editorContent })
            })
            const data = await res.json()
            if (data.ok) {
                toast.success('Alterações salvas!')
                setPost(data.data)
            }
        } catch (err) {
            toast.error('Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const handlePublish = async () => {
        setPublishing(true)
        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: 'POST'
            })
            const data = await res.json()
            if (data.ok) {
                toast.success('Publicado no LinkedIn com sucesso!')
                router.push('/posts')
            } else {
                toast.error(data.error?.message || 'Erro ao publicar')
            }
        } catch (err) {
            toast.error('Erro de conexão')
        } finally {
            setPublishing(false)
        }
    }

    if (loading) return <SkeletonEditor />

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/posts"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Editar Draft</h1>
                        <p className="text-muted-foreground text-sm">Refine o conteúdo antes de publicar.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleSave} disabled={saving || publishing} className="gap-2">
                        <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button onClick={handlePublish} disabled={saving || publishing} className="gap-2 bg-primary hover:bg-primary/90">
                        <Rocket className="w-4 h-4" /> {publishing ? 'Publicando...' : 'Publicar Agora'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lado Esquerdo: Editor */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <Label className="text-lg font-semibold">Conteúdo do Post</Label>
                            <Badge variant="secondary" className="capitalize">{post?.format}</Badge>
                        </div>
                        <Textarea
                            className="min-h-[500px] text-lg leading-relaxed focus-visible:ring-primary/20"
                            value={editorContent}
                            onChange={(e) => setEditorContent(e.target.value)}
                        />
                    </Card>

                    {/* Scoring & Feedback */}
                    <Card className="p-6 border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-lg">AI Score & Feedback</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <ScoreItem label="Hook" value={post?.scoreHook} />
                                <ScoreItem label="Clareza" value={post?.scoreClarity} />
                                <ScoreItem label="Engajamento" value={post?.scoreEngagementPrediction} />
                                <ScoreItem label="Autoridade" value={post?.scoreDepth} />
                            </div>
                            <div className="pt-4 border-t border-primary/10">
                                <p className="text-sm italic text-muted-foreground">"{post?.scoreFeedback}"</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Lado Direito: Preview LinkedIn */}
                <div className="space-y-6">
                    <Label className="text-lg font-semibold px-2">Preview (Desktop)</Label>
                    <Card className="bg-white text-black max-w-[550px] mx-auto shadow-md border-none rounded-lg overflow-hidden font-sans">
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-muted rounded-full shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="h-4 w-32 bg-muted rounded mb-1" />
                                    <div className="h-3 w-48 bg-muted/50 rounded" />
                                </div>
                            </div>

                            <div className="text-sm whitespace-pre-wrap leading-normal min-h-[300px]">
                                {editorContent || 'O conteúdo do seu post aparecerá aqui...'}
                            </div>

                            <div className="pt-3 border-t flex items-center justify-between text-[#666666] text-sm font-semibold">
                                <div className="flex items-center gap-1 px-3 py-2 hover:bg-[#ebebeb] rounded cursor-pointer transition-colors">
                                    <ThumbsUp size={16} /> <span>Gostei</span>
                                </div>
                                <div className="flex items-center gap-1 px-3 py-2 hover:bg-[#ebebeb] rounded cursor-pointer transition-colors">
                                    <MessageSquare size={16} /> <span>Comentar</span>
                                </div>
                                <div className="flex items-center gap-1 px-3 py-2 hover:bg-[#ebebeb] rounded cursor-pointer transition-colors">
                                    <Repeat2 size={16} /> <span>Compartilhar</span>
                                </div>
                                <div className="flex items-center gap-1 px-3 py-2 hover:bg-[#ebebeb] rounded cursor-pointer transition-colors">
                                    <Share2 size={16} /> <span>Enviar</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function ScoreItem({ label, value }: { label: string, value: number }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="font-medium">{label}</span>
                <span>{value}%</span>
            </div>
            <Progress value={value} className="h-1" />
        </div>
    )
}

function SkeletonEditor() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <Skeleton className="h-[600px] w-full rounded-xl" />
                <Skeleton className="h-[500px] w-full rounded-xl" />
            </div>
        </div>
    )
}
