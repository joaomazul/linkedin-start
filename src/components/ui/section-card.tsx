"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionCardProps extends React.ComponentProps<"div"> {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}

function SectionCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  ...props
}: SectionCardProps) {
  return (
    <div
      data-slot="section-card"
      className={cn(
        "bg-white rounded-[var(--r-xl)] p-[22px_24px] shadow-sm border border-edge",
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              {title && (
                <h3 className="text-[14px] font-bold text-ink">{title}</h3>
              )}
              {subtitle && (
                <p className="text-[12px] text-ink-4">{subtitle}</p>
              )}
            </div>
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

export { SectionCard }
export type { SectionCardProps }
