"use client";

import { AppShell } from '@/components/layout/AppShell'

import { FeedContainer } from '@/components/feed/FeedContainer'

export default function FeedPage() {
    return (
        <AppShell title="Feed">
            <FeedContainer />
        </AppShell>
    )
}
