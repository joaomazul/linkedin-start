"use client";

import { useState, useEffect } from 'react'

import { Plus, LayoutList, CheckCircle, FileText, Pencil, Rocket } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PostsPage() {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('draft')

    const fetchPosts = async (status: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/posts?status=${status}`)
            const data = await res.json()
            if (data.ok) {
                setPosts(data.data)
            }
        } catch (err) {
            toast.error('Erro ao buscar posts')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts(activeTab)
    }, [activeTab])

    return (
        <div className="flex flex-col gap-6 py-6">
            <PageHeader title="Post Intelligence" subtitle="Crie posts virais otimizados para o seu perfil do LinkedIn.">
                <Button asChild variant="accent" className="gap-2">
                    <Link href="/posts/new">
                        <Plus className="w-4 h-4" /> Novo Post
                    </Link>
                </Button>
            </PageHeader>

            <Tabs defaultValue="draft" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="draft" className="gap-2">
                            <FileText className="w-4 h-4" /> Rascunhos
                        </TabsTrigger>
                        <TabsTrigger value="published" className="gap-2">
                            <CheckCircle className="w-4 h-4" /> Publicados
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="draft" className="mt-0">
                    <PostsGrid posts={posts} loading={loading} />
                </TabsContent>
                <TabsContent value="published" className="mt-0">
                    <PostsGrid posts={posts} loading={loading} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function PostsGrid({ posts, loading }: { posts: any[], loading: boolean }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-[var(--r-xl)]" />
                ))}
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-14 text-center gap-3 border-2 border-dashed border-edge rounded-[var(--r-xl)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] bg-page mb-1">
                    <LayoutList className="h-6 w-6 text-ink-4" />
                </div>
                <h3 className="text-[16px] font-bold text-ink">Nenhum post encontrado</h3>
                <p className="text-[13px] text-ink-4 max-w-[320px] leading-[1.65]">Você ainda não tem posts nesta categoria. Comece criando um novo post!</p>
                <Button asChild variant="outline" className="mt-2">
                    <Link href="/posts/new">Criar meu primeiro post</Link>
                </Button>
            </div>
        )
    }

    const sortedPosts = [...posts].sort((a, b) => (b.scoreOverall || 0) - (a.scoreOverall || 0))

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    )
}

function PostCard({ post }: { post: any }) {
    const scoreColor = post.scoreOverall >= 80 ? 'text-success-text' : post.scoreOverall >= 60 ? 'text-warn-text' : 'text-danger-text'

    return (
        <div className="bg-white border border-edge rounded-[var(--r-xl)] flex flex-col h-full hover:shadow-md transition-all duration-[var(--t-base)] hover:-translate-y-[2px] overflow-hidden">
            <div className="p-5 flex-1 flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className="capitalize">{post.format || 'Post'}</Badge>
                    {post.scoreOverall && (
                        <div className={`text-[13px] font-bold ${scoreColor}`}>
                            Score: {post.scoreOverall}
                        </div>
                    )}
                </div>

                <p className="text-[13px] line-clamp-4 text-ink-3 flex-1">
                    {post.body}
                </p>

                <div className="text-[10px] text-ink-4 flex items-center gap-2 flex-wrap">
                    <span>{format(new Date(post.createdAt), "dd MMM", { locale: ptBR })}</span>
                    <span>•</span>
                    <span>{post.body?.length || 0} chars</span>
                    {post.status === 'published' && (
                        <Badge variant="success" dot className="h-4 text-[9px]">Publicado</Badge>
                    )}
                </div>
            </div>

            <div className="px-5 py-3 border-t border-edge bg-page flex justify-between items-center gap-2">
                <Button asChild variant="ghost" size="xs" className="flex-1 gap-1.5">
                    <Link href={`/posts/${post.id}`}>
                        <Pencil className="w-3 h-3" /> Editar
                    </Link>
                </Button>
                {post.status === 'draft' && (
                    <Button variant="ghost" size="xs" className="flex-1 gap-1.5 text-brand hover:text-brand">
                        <Rocket className="w-3 h-3" /> Publicar
                    </Button>
                )}
            </div>
        </div>
    )
}
