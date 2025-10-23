import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] body-m font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-default)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary-default)] text-gray-100 shadow hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]",
        destructive:
          "bg-[var(--semantic-error)] text-gray-100 shadow-sm hover:bg-[var(--semantic-error)]/90",
        outline:
          "border border-gray-400 bg-gray-100 shadow-sm hover:bg-gray-200 text-gray-900",
        secondary:
          "bg-gray-200 text-gray-900 shadow-sm hover:bg-gray-300",
        ghost: "hover:bg-gray-200 text-gray-800",
        link: "text-[var(--primary-default)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-[var(--space-4)] py-[var(--space-2)]",
        sm: "h-8 rounded-[var(--radius-md)] px-[var(--space-3)] body-s",
        lg: "h-10 rounded-[var(--radius-md)] px-[var(--space-8)]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
