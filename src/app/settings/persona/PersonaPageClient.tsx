"use client";

export const dynamic = 'force-dynamic'


import { AppShell } from '@/components/layout/AppShell'
import { PersonaEditor } from '@/components/settings/PersonaEditor'

export default function PersonaPage() {
    return (
        <AppShell title="Meu Perfil IA">
            <PersonaEditor />
        </AppShell>
    )
}
