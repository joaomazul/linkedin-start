"use client";

import React from 'react'
import { LinkedInPost } from '@/types/linkedin.types'
import { PostHeader } from './PostHeader'
import { PostBody } from './PostBody'
import { PostStats } from './PostStats'
import { CommentZone } from './CommentZone'
import { motion } from 'framer-motion'

interface PostCardProps {
    post: LinkedInPost
    index?: number
}

export const PostCard = React.memo(function PostCard({ post, index = 0 }: PostCardProps) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="group relative rounded-[var(--r-xl)] border border-edge bg-white shadow-sm transition-all duration-[var(--t-base)] hover:shadow-md overflow-hidden mb-6"
        >
            <div className="p-[22px_24px]">
                <PostHeader
                    authorName={post.authorName}
                    authorRole={post.authorRole}
                    authorInitials={post.authorInitials}
                    authorColor={post.authorColor}
                    authorId={post.authorId}
                    postedAt={post.postedAt}
                    url={post.url}
                />

                <PostBody
                    text={post.text}
                    imageUrls={post.imageUrls}
                    videoUrl={post.videoUrl}
                    articleUrl={post.articleUrl}
                    articleTitle={post.articleTitle}
                />

                <PostStats metrics={post.metrics} />
            </div>

            {/* Separador suave Cockpit */}
            <div className="h-[1px] w-full bg-edge opacity-60" />

            <CommentZone
                post={{
                    id: post.id,
                    linkedinPostId: post.linkedinPostId,
                    text: post.text,
                    authorName: post.authorName,
                }}
            />
        </motion.article>
    )
})
