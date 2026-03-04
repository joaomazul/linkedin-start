"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface EmptyStateAction {
  label: string
  href: string
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-14 text-center gap-3 border-2 border-dashed border-edge rounded-[var(--r-xl)]",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] bg-page mb-1">
        {icon}
      </div>
      <h3 className="text-[16px] font-bold text-ink">{title}</h3>
      <p className="text-[13px] text-ink-4 max-w-[320px] leading-[1.65]">
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="inline-flex items-center justify-center rounded-full bg-ink text-white px-5 py-2.5 text-[13px] font-bold transition-colors hover:bg-brand"
            >
              {primaryAction.label}
            </Link>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center justify-center rounded-full bg-page text-ink-3 px-5 py-2.5 text-[13px] font-bold transition-colors hover:bg-ink hover:text-white"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
