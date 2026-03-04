"use client";

import React from 'react'
import { Switch } from '@/components/ui/switch'
import { useProfilesStore } from '@/store/profiles.store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

interface ProfileRowProps {
    profileId: string
}

export const ProfileRow = React.memo(function ProfileRow({ profileId }: ProfileRowProps) {
    const profile = useProfilesStore((s) => s.profiles.find((p) => p.id === profileId))
    const toggleProfile = useProfilesStore((s) => s.toggleProfile)

    if (!profile) return null

    const handleToggle = async () => {
        // Otimisticamente atualiza o store
        toggleProfile(profile.id)

        try {
            const res = await fetch(`/api/linkedin/profiles/${profile.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !profile.active }),
            })
            if (!res.ok) throw new Error('Falha ao atualizar')
        } catch {
            // Reverte se a chamada falhar
            toggleProfile(profile.id)
            toast.error('Não foi possível salvar a alteração')
        }
    }

    return (
        <div
            className={cn(
                "group relative h-[44px] flex items-center px-3 gap-[8px] transition-all duration-[var(--t-fast)] cursor-pointer",
                "hover:bg-hover",
                !profile.active && "opacity-60 grayscale-[0.5]"
            )}
            onClick={handleToggle}
        >
            {/* Indicador lateral ativo */}
            <div
                className={cn(
                    "absolute left-0 w-[3px] h-[22px] rounded-r-[2px] transition-opacity duration-[var(--t-fast)]",
                    profile.active ? "opacity-100" : "opacity-0"
                )}
                style={{ backgroundColor: profile.color }}
            />

            {/* Avatar */}
            <div className="relative shrink-0">
                <div
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-full lf-subtitle font-bold"
                    style={{
                        backgroundColor: `${profile.color}26`, // 15% opacity roughly
                        color: profile.color
                    }}
                >
                    {profile.initials}
                </div>
                {/* Badge de novo post seria aqui, adicionando dot laranja quando houver count > 0 */}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="truncate text-[14px] font-bold text-ink leading-tight">
                    {profile.name}
                </h4>
                <p className="truncate text-[11px] text-ink-3">
                    {profile.role || 'Perfis LinkedIn'}
                </p>
            </div>

            {/* Toggle */}
            <div
                className="shrink-0 ml-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <Switch
                    checked={profile.active}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-hover data-[state=unchecked]:border data-[state=unchecked]:border-edge w-[28px] h-[16px] scale-100"
                    thumbClassName="w-[12px] h-[12px] data-[state=checked]:translate-x-[13px] data-[state=unchecked]:translate-x-[1px]"
                    aria-label={`Ativar monitoramento de ${profile.name}`}
                />
            </div>
        </div>
    )
})

