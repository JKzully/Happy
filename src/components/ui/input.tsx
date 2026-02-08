import * as React from "react"

import { cn } from "@/lib/cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-text-dim h-9 w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition-[color,box-shadow] outline-none",
        "focus:border-primary focus:ring-1 focus:ring-primary",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-text-dim disabled:opacity-50",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "[color-scheme:dark]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
