"use client";

import { AppShell } from '@/components/layout/AppShell'
import { PromptsEditor } from '@/components/settings/PromptsEditor'

export default function PromptsPage() {
    return (
        <AppShell title="Configuração de Prompts" showRightPanel={false}>
            <PromptsEditor />
        </AppShell>
    )
}
