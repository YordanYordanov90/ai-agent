import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-mono font-bold uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:translate-x-[2px] hover:translate-y-[2px]",
  {
    variants: {
      variant: {
        default: "bg-emerald-500 text-black hover:bg-emerald-400",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-[4px_4px_0px_#7f1d1d] hover:shadow-[2px_2px_0px_#7f1d1d]",
        outline: "border-2 border-zinc-700 bg-transparent text-white hover:border-emerald-500 hover:text-emerald-400 shadow-[4px_4px_0px_#27272a] hover:shadow-[2px_2px_0px_#27272a]",
        secondary: "bg-zinc-800 text-white hover:bg-zinc-700 shadow-[4px_4px_0px_#18181b] hover:shadow-[2px_2px_0px_#18181b]",
        ghost: "hover:bg-zinc-900 hover:text-white shadow-none hover:translate-x-0 hover:translate-y-0",
        link: "text-zinc-400 underline-offset-4 hover:underline hover:text-emerald-400 shadow-none hover:translate-x-0 hover:translate-y-0",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-10 px-4",
        lg: "h-16 px-10 text-lg",
        icon: "h-12 w-12",
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
