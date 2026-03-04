"use client";

import * as React from "react"


import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-[var(--r-md)] border-[1.5px] border-edge bg-white px-4 py-2 text-[13px] font-medium shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/5 focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
