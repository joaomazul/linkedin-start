import React from 'react'
import { RefreshCw, Menu, Zap } from 'lucide-react'

interface TopbarProps {
    title: string
    badge?: string
    children?: React.ReactNode
    onMenuClick?: () => void
}

export function Topbar({ title, children, onMenuClick }: TopbarProps) {
    return (
        <header className="h-[var(--topbar-height)] bg-white border-b border-edge flex items-center px-4 md:px-5 gap-3 shrink-0 grow-0 sticky top-0 z-50 shadow-xs">
            {/* Mobile menu */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-ink-3 hover:text-ink hover:bg-page rounded-[10px] transition-colors"
            >
                <Menu size={18} />
            </button>

            {/* Logo zone — aligned with sidebar (72px) */}
            <div className="hidden lg:flex w-[40px] shrink-0 items-center justify-center">
                <div className="h-8 w-8 rounded-[10px] bg-ink flex items-center justify-center">
                    <span className="text-lime text-[10px] font-bold tracking-tight">LF</span>
                </div>
            </div>

            {/* Page title */}
            <h1 className="text-[15px] font-bold text-ink">
                {title}
            </h1>

            {/* Center slot */}
            <div className="flex-1 flex justify-center items-center px-4">
                {children}
            </div>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-3">
                {/* Credit pill */}
                <div className="hidden sm:flex items-center gap-1.5 bg-page rounded-full px-3 py-1.5">
                    <Zap size={12} className="text-ink" />
                    <span className="text-xs font-semibold text-ink-4">
                        <span className="text-ink">∞</span> créditos
                    </span>
                </div>

                {/* Refresh button */}
                <button className="h-8 w-8 rounded-[10px] bg-page text-ink-3 flex items-center justify-center hover:bg-ink hover:text-white transition-all duration-[var(--t-base)] group">
                    <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
            </div>
        </header>
    )
}
