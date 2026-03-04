"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  containerClassName?: string
}

function SearchInput({
  className,
  containerClassName,
  placeholder = "Buscar...",
  ...props
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-white border-[1.5px] border-edge rounded-full px-4 py-[9px] min-w-[200px] transition-colors hover:border-ink focus-within:border-brand",
        containerClassName
      )}
    >
      <Search size={14} className="text-ink-4 shrink-0" strokeWidth={2} />
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          "text-[13px] font-medium text-ink border-none bg-transparent flex-1 outline-none placeholder:text-ink-4",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { SearchInput }
export type { SearchInputProps }
