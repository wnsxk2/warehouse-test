import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[var(--radius-md)] border border-gray-400 bg-gray-100 px-[var(--space-3)] py-[var(--space-1)] body-m text-gray-900 shadow-sm transition-colors file:border-0 file:bg-transparent file:body-s file:font-medium file:text-gray-900 placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-default)] focus-visible:border-[var(--primary-default)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
