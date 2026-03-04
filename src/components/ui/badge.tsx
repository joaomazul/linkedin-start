"use client";

import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        lime: "bg-success-bg text-success-text",
        blue: "bg-brand-light text-brand",
        dark: "bg-ink text-white",
        grey: "bg-page text-ink-3",
        success: "bg-success-bg text-success-text",
        warn: "bg-warn-bg text-warn-text",
        danger: "bg-danger-bg text-danger-text",
        pro: "bg-ink text-lime",
        live: "bg-[#e6fdf0] text-[#22a24d]",
        secondary: "bg-hover text-ink-2",
        destructive: "bg-destructive text-white",
        outline: "border-edge text-ink-3",
        ghost: "hover:bg-hover hover:text-ink",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  dot = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean; dot?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && (
        <span className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          variant === "live" && "bg-[#22a24d] animate-[badge-dot-pulse_2s_ease-in-out_infinite]",
          variant === "success" && "bg-success-text",
          variant === "danger" && "bg-danger-text",
          variant === "warn" && "bg-warn-text",
          !["live", "success", "danger", "warn"].includes(variant || "") && "bg-current"
        )} />
      )}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
