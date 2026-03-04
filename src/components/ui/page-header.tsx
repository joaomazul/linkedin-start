"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-7", className)}>
      <div>
        <h1 className="text-[28px] font-black tracking-[-1px] text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] font-medium text-ink-4 mt-[5px]">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}

export { PageHeader }
export type { PageHeaderProps }
