"use client";

import React, { useMemo, useState, useEffect } from 'react'
import { useFeed } from '@/hooks/useFeed'
import { useProfilesStore } from '@/store/profiles.store'
import { useSettingsStore } from '@/store/settings.store'
import { useFeedStore } from '@/store/feed.store'
import { PostCard } from '@/components/feed/PostCard'
import { PostCardSkeleton } from '@/components/feed/PostCardSkeleton'
import { EmptyFeedState, ErrorState } from '@/components/feed/EmptyFeedState'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { LinkedInPost } from '@/types/linkedin.types'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function FeedContainer() {
    const profiles = useProfilesStore((s) => s.profiles)
    const activeProfileIds = profiles.filter(p => p.active).map(p => p.id)
    const linkedinAccountId = useSettingsStore(s => s.linkedinAccountId)
    const [searchQuery, setSearchQuery] = useState('')

    const {
        data: feedResponse,
        isLoading,
        error,
        refetch,
        isFetching
    } = useFeed()

    // Sync lastRefreshedAt to feed store so Topbar can display it
    useEffect(() => {
        if (feedResponse && !isLoading) {
            useFeedStore.setState({ lastRefreshedAt: new Date().toISOString() })
        }
    }, [feedResponse, isLoading])

    // Extrai o array SEMPRE com fallback para []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbPosts: any[] = Array.isArray((feedResponse as any)?.data?.items)
        ? (feedResponse as any).data.items
        : Array.isArray((feedResponse as any)?.data)
            ? (feedResponse as any).data
            : Array.isArray((feedResponse as any)?.items)
                ? (feedResponse as any).items
                : Array.isArray(feedResponse)
                    ? feedResponse
                    : []

    const posts: LinkedInPost[] = useMemo(() => {
        return dbPosts.map(post => {
            const profile = profiles.find(p => p.id === post.profileId)

            // Fallback: usa dados cacheados do próprio post quando o perfil não está no store ainda
            const authorName = profile?.name || post.authorName || 'Perfil desconhecido'
            const authorRole = profile?.role || post.authorHeadline || ''
            const authorInitials = profile?.initials ||
                authorName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '??'
            const authorColor = profile?.color || '#6366f1'
            const authorAvatarUrl = profile?.avatarUrl || post.authorAvatarUrl || undefined

            return {
                id: post.id,
                linkedinPostId: post.linkedinPostId,
                authorId: profile?.id || post.profileId,
                authorName,
                authorRole,
                authorLinkedinId: profile?.linkedinId,
                authorInitials,
                authorColor,
                authorAvatarUrl,
                text: post.text || '',
                htmlText: post.htmlText || undefined,
                imageUrls: post.imageUrls || [],
                videoUrl: post.videoUrl || undefined,
                articleUrl: post.articleUrl || undefined,
                articleTitle: post.articleTitle || undefined,
                url: post.postUrl || (post.linkedinPostId?.includes('urn:li:')
                    ? `https://www.linkedin.com/feed/update/${post.linkedinPostId}`
                    : `https://www.linkedin.com/feed/update/urn:li:activity:${post.linkedinPostId}`),
                metrics: {
                    likes: post.likesCount || 0,
                    comments: post.commentsCount || 0,
                    reposts: post.repostsCount || 0,
                },
                postedAt: new Date(post.postedAt).toISOString(),
                fetchedAt: post.fetchedAt ? new Date(post.fetchedAt).toISOString() : new Date().toISOString(),
                commentStatus: post.commentStatus,
            } as LinkedInPost
        }).filter(Boolean) as LinkedInPost[]
    }, [dbPosts, profiles])

    const filteredPosts = useMemo(() => {
        // Filter by active profiles first (instant removal when toggled off)
        let filtered = posts.filter(p => activeProfileIds.includes(p.authorId))
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            filtered = filtered.filter(p =>
                (p.text && p.text.toLowerCase().includes(q)) ||
                (p.authorName && p.authorName.toLowerCase().includes(q))
            )
        }
        return filtered
    }, [posts, searchQuery, activeProfileIds])

    const handleRefresh = async () => {
        const toastId = toast.loading('Sincronizando feed...')

        try {
            const res = await fetch('/api/linkedin/feed?sync=true')
            if (!res.ok) throw new Error('Falha ao sincronizar')

            const json = await res.json()
            await refetch()

            // Update feed store timestamp
            useFeedStore.setState({ lastRefreshedAt: new Date().toISOString() })

            const { syncedCount = 0, failedCount = 0, skippedCount = 0, failedProfiles = [] } = json.data || {}

            if (failedCount > 0 && syncedCount > 0) {
                toast.warning(`Sincronizado parcialmente: ${syncedCount} ok, ${failedCount} falharam`, {
                    id: toastId,
                    description: `Falharam: ${failedProfiles.slice(0, 3).join(', ')}${failedProfiles.length > 3 ? '...' : ''}`,
                    duration: 6000,
                })
            } else if (failedCount > 0 && syncedCount === 0) {
                toast.error('Falha na sincronização de todos os perfis', {
                    id: toastId,
                    description: 'Verifique a conexão com o LinkedIn em Configurações',
                    duration: 6000,
                })
            } else if (syncedCount === 0 && skippedCount > 0) {
                toast.success(`Feed já está atualizado (${skippedCount} perfis sincronizados recentemente)`, { id: toastId })
            } else {
                const extra = skippedCount > 0 ? ` · ${skippedCount} já atualizados` : ''
                toast.success(`Feed sincronizado (${syncedCount} perfis)${extra}`, { id: toastId })
            }
        } catch (err) {
            toast.error('Erro na conexão com o servidor', {
                id: toastId,
                description: (err as Error).message,
            })
        }
    }

    if (!linkedinAccountId) {
        return (
            <div className="max-w-3xl mx-auto w-full px-6 py-12">
                <ErrorState
                    title="Engine Desconectada"
                    message="Vincule sua conta técnica do LinkedIn nas configurações para ativar o monitoramento."
                />
            </div>
        )
    }

    if (activeProfileIds.length === 0) {
        return (
            <div className="max-w-3xl mx-auto w-full px-6 py-12">
                <EmptyFeedState
                    title="Nenhum Alvo Ativo"
                    message="Ative ou adicione perfis estratégicos na barra lateral para começar a coletar dados."
                />
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 p-6 max-w-2xl mx-auto animate-pulse">
                {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto w-full px-6 py-12">
                <ErrorState title="Falha Crítica" message={(error as Error).message} />
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Header do Feed */}
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-7 gap-4">
                <div>
                    <h2 className="text-[28px] font-black tracking-[-1px] text-ink">
                        Feed Tático
                    </h2>
                    <p className="text-[13px] font-medium text-ink-4 mt-[5px]">
                        Monitoramento em real-time das conexões selecionadas.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 bg-white border-[1.5px] border-edge rounded-full px-4 py-[9px] min-w-[200px] md:w-[260px] transition-colors hover:border-ink focus-within:border-brand">
                        <Search size={14} className="text-ink-4 shrink-0" strokeWidth={2} />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Filtrar feed..."
                            className="text-[13px] font-medium text-ink border-none bg-transparent flex-1 outline-none placeholder:text-ink-4"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-ink-4 hover:text-ink transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="h-9 w-9 rounded-[10px]"
                    >
                        <RefreshCcw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Lista de Posts */}
            <div className="flex flex-col gap-10 relative">
                <AnimatePresence mode="popLayout" initial={false}>
                    {filteredPosts.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="py-12"
                        >
                            <EmptyFeedState
                                title={searchQuery ? "Nenhum Match" : "Frequência Silenciosa"}
                                message={searchQuery ? `Não encontramos registros para "${searchQuery}"` : "Aguardando novos sinais de atividade dos perfis monitorados."}
                            />
                        </motion.div>
                    ) : (
                        filteredPosts.map((post, i) => (
                            <PostCard key={post.id} post={post} index={i} />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
