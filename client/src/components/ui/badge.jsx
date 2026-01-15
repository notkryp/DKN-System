import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-purple-100 text-purple-900 hover:bg-purple-200",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        destructive: "border-transparent bg-red-100 text-red-900 hover:bg-red-200",
        outline: "text-gray-950 border-gray-200",
        success: "border-transparent bg-green-100 text-green-900 hover:bg-green-200",
        warning: "border-transparent bg-yellow-100 text-yellow-900 hover:bg-yellow-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
