import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const missionButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 mission-glow",
        destructive: "bg-mission-critical text-background shadow-sm hover:bg-mission-critical/90 mission-glow-critical",
        outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-mission-success text-background shadow hover:bg-mission-success/90 mission-glow-success",
        warning: "bg-mission-warning text-background shadow hover:bg-mission-warning/90 mission-glow-warning",
        mission: "bg-gradient-to-r from-primary to-mission-info text-background shadow-lg hover:opacity-90 mission-glow border border-primary/20"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MissionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof missionButtonVariants> {
  asChild?: boolean
}

const MissionButton = React.forwardRef<HTMLButtonElement, MissionButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(missionButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
MissionButton.displayName = "MissionButton"

export { MissionButton, missionButtonVariants }