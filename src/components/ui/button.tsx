"use client";

import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:stroke-2 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand/20",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-brand shadow-sm",
        accent: "bg-lime text-ink hover:bg-lime-dark shadow-sm",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border-[1.5px] border-edge bg-white text-ink hover:border-ink",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-page text-ink-3 hover:bg-ink hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 text-[13px]",
        xs: "h-7 gap-1 rounded-full px-3 text-[11px]",
        sm: "h-9 rounded-full gap-1.5 px-4 text-[12px] py-[7px]",
        lg: "h-12 rounded-full px-6 text-[15px] py-[12px]",
        icon: "size-9 rounded-[10px]",
        "icon-xs": "size-7 rounded-[var(--r-sm)]",
        "icon-sm": "size-9 rounded-[10px]",
        "icon-lg": "size-14 rounded-[var(--r-md)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
