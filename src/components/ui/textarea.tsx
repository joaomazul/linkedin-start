"use client";

import * as React from "react"


import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-[var(--r-md)] border-[1.5px] border-edge bg-white px-4 py-3 text-[13px] font-medium shadow-sm transition-all placeholder:text-ink-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/5 focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
