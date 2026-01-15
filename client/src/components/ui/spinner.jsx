import * as React from "react"
import { cn } from "../../lib/utils"

const Spinner = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent text-purple-600",
      className
    )}
    {...props}
  />
))
Spinner.displayName = "Spinner"

export { Spinner }
