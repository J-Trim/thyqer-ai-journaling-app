
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:shadow-neumorph-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-95 focus-visible:bg-primary-focus",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95",
        outline:
          "border border-input bg-background shadow-neumorph hover:shadow-neumorph-hover hover:scale-[1.02] active:shadow-neumorph-active active:scale-[0.98] focus-visible:border-primary-focus",
        secondary:
          "bg-secondary text-secondary-foreground shadow-neumorph hover:shadow-neumorph-hover hover:scale-[1.02] active:shadow-neumorph-active active:scale-[0.98] focus-visible:bg-secondary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95 focus-visible:bg-accent/10",
        link: "text-primary underline-offset-4 hover:underline focus-visible:text-primary-focus",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
