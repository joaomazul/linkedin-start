"use client";

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
    LayoutGrid,
    PenLine,
    Activity,
    BarChart2,
    Users,
    Zap,
    ListChecks,
    MessageSquare,
    UserCircle,
    Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const mainNav = [
    { href: '/feed', icon: LayoutGrid, label: 'Feed' },
    { href: '/posts', icon: PenLine, label: 'Posts' },
    { href: '/campaigns', icon: Activity, label: 'Campanhas', prefix: true },
    { href: '/analytics', icon: BarChart2, label: 'Analytics' },
    { href: '/crm', icon: Users, label: 'CRM Social', prefix: true },
    { href: '/signals', icon: Zap, label: 'Signals' },
    { href: '/cadence', icon: ListChecks, label: 'Cadência' },
]

const settingsNav = [
    { href: '/settings/prompts', icon: MessageSquare, label: 'Prompts' },
    { href: '/settings/persona', icon: UserCircle, label: 'Perfil IA' },
    { href: '/settings/account', icon: Link2, label: 'Conta' },
]

export function Sidebar() {
    const pathname = usePathname()

    const isActive = (href: string, prefix?: boolean) =>
        prefix ? pathname.startsWith(href) : pathname === href

    return (
        <aside className="flex w-[72px] h-full flex-col border-r border-edge bg-white shrink-0 overflow-hidden items-center py-3">
            {/* Logo */}
            <div className="mb-4 shrink-0">
                <div className="h-8 w-8 rounded-[10px] bg-ink flex items-center justify-center">
                    <span className="text-lime text-[10px] font-bold tracking-tight">LF</span>
                </div>
            </div>

            {/* Section: NAV */}
            <span className="text-[9px] font-bold tracking-[1.5px] uppercase text-ink-4 mb-1">NAV</span>

            <nav className="flex flex-1 flex-col items-center gap-0.5 w-full px-3">
                {mainNav.map((item) => (
                    <SidebarItem
                        key={item.href}
                        href={item.href}
                        icon={<item.icon size={17} strokeWidth={1.8} />}
                        label={item.label}
                        active={isActive(item.href, item.prefix)}
                    />
                ))}

                {/* Divider */}
                <div className="h-px w-8 bg-edge my-2" />

                {settingsNav.map((item) => (
                    <SidebarItem
                        key={item.href}
                        href={item.href}
                        icon={<item.icon size={17} strokeWidth={1.8} />}
                        label={item.label}
                        active={isActive(item.href)}
                    />
                ))}
            </nav>

            {/* Footer: Avatar */}
            <div className="mt-auto shrink-0 pb-1">
                <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                        elements: {
                            avatarBox: "h-8 w-8 rounded-full"
                        }
                    }}
                />
            </div>
        </aside>
    )
}

function SidebarItem({
    href,
    icon,
    label,
    active,
}: {
    href: string
    icon: React.ReactNode
    label: string
    active: boolean
}) {
    return (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <Link
                    href={href}
                    className={cn(
                        'flex flex-col items-center justify-center w-12 h-11 rounded-[var(--r-md)] gap-[3px] transition-all duration-[var(--t-base)]',
                        active
                            ? 'bg-ink text-lime'
                            : 'text-ink-4 hover:bg-page hover:text-ink'
                    )}
                >
                    {icon}
                    <span className="text-[8px] font-semibold tracking-[0.3px] text-center whitespace-nowrap leading-none">
                        {label}
                    </span>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-sans font-semibold">
                {label}
            </TooltipContent>
        </Tooltip>
    )
}
