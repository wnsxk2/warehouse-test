import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-sm)] border px-[var(--space-2)] py-[var(--space-1)] caption font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-default)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary-default)] text-gray-100 shadow hover:bg-[var(--primary-hover)]",
        secondary:
          "border-transparent bg-gray-200 text-gray-900 hover:bg-gray-300",
        destructive:
          "border-transparent bg-[var(--semantic-error)] text-gray-100 shadow hover:bg-[var(--semantic-error)]/90",
        outline: "border-gray-400 text-gray-900 bg-gray-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
