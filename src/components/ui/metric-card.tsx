"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const metricCardVariants = cva(
  "relative rounded-[var(--r-lg)] p-[18px_20px] border transition-all duration-[var(--t-base)] hover:shadow-md hover:-translate-y-[2px] cursor-default",
  {
    variants: {
      variant: {
        default: "bg-white border-edge shadow-sm",
        dark: "bg-ink border-transparent shadow-sm",
        lime: "bg-lime border-transparent shadow-sm",
        blue: "bg-white border-edge shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface TrendData {
  value: number
  direction: "up" | "down" | "neutral"
}

interface MetricCardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof metricCardVariants> {
  value: string | number
  label: string
  icon?: React.ReactNode
  trend?: TrendData
  isLoading?: boolean
}

function MetricCard({
  className,
  variant = "default",
  value,
  label,
  icon,
  trend,
  isLoading,
  ...props
}: MetricCardProps) {
  const isDark = variant === "dark"
  const isLime = variant === "lime"
  const isBlue = variant === "blue"

  return (
    <div
      data-slot="metric-card"
      className={cn(metricCardVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {isLoading ? (
            <>
              <div className={cn(
                "h-8 w-20 rounded-[var(--r-sm)] animate-pulse",
                isDark ? "bg-white/10" : "bg-page"
              )} />
              <div className={cn(
                "h-3 w-16 rounded-[var(--r-xs)] animate-pulse mt-1",
                isDark ? "bg-white/10" : "bg-page"
              )} />
            </>
          ) : (
            <>
              <p className={cn(
                "text-[28px] font-black tracking-[-1px] leading-none",
                isDark && "text-white",
                isLime && "text-ink",
                !isDark && !isLime && "text-ink"
              )}>
                {value}
              </p>
              <p className={cn(
                "text-[11px] font-semibold mt-1",
                isDark && "text-white/40",
                isLime && "text-ink/50",
                !isDark && !isLime && "text-ink-4"
              )}>
                {label}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {icon && (
            <div className={cn(
              "flex h-[30px] w-[30px] items-center justify-center rounded-[var(--r-sm)] shrink-0",
              isDark && "bg-white/10 text-white",
              isLime && "bg-ink/10 text-ink",
              isBlue && "bg-brand/10 text-brand",
              !isDark && !isLime && !isBlue && "bg-page text-ink-3"
            )}>
              {icon}
            </div>
          )}

          {trend && !isLoading && (
            <TrendBadge trend={trend} isDark={isDark} isLime={isLime} />
          )}
        </div>
      </div>
    </div>
  )
}

function TrendBadge({ trend, isDark, isLime }: { trend: TrendData; isDark: boolean; isLime: boolean }) {
  const isUp = trend.direction === "up"
  const isDown = trend.direction === "down"

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
      isUp && !isDark && !isLime && "bg-success-bg text-success-text",
      isDown && !isDark && !isLime && "bg-danger-bg text-danger-text",
      !isUp && !isDown && !isDark && !isLime && "bg-page text-ink-4",
      isDark && isUp && "bg-white/10 text-lime",
      isDark && isDown && "bg-white/10 text-danger-text",
      isDark && !isUp && !isDown && "bg-white/10 text-white/40",
      isLime && "bg-ink/10 text-ink",
    )}>
      {isUp && <TrendingUp size={10} strokeWidth={2.5} />}
      {isDown && <TrendingDown size={10} strokeWidth={2.5} />}
      {!isUp && !isDown && <Minus size={10} strokeWidth={2.5} />}
      {trend.value > 0 ? "+" : ""}{trend.value}%
    </span>
  )
}

export { MetricCard, metricCardVariants }
export type { MetricCardProps, TrendData }
