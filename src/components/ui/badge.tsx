
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        unread: "!border-transparent !bg-red-500 !text-white min-w-5 h-5 flex items-center justify-center !z-10",
        dot: "!w-2 !h-2 !p-0 !border-0 !bg-red-500 !rounded-full !block !z-10 !opacity-100 !visible"
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
  // Enhanced inline styles for dot variant to ensure visibility
  const inlineStyles: React.CSSProperties = variant === "dot" ? {
    display: "block",
    opacity: 1,
    visibility: "visible" as const, // Type assertion to fix the error
    backgroundColor: "rgb(239, 68, 68)",
    width: "8px",
    height: "8px",
    minWidth: "8px",
    minHeight: "8px",
    borderRadius: "50%",
    zIndex: 10
  } : {};

  return (
    <div 
      className={cn(badgeVariants({ variant }), className)}
      style={inlineStyles}
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
