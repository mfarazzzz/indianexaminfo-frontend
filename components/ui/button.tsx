import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:   "bg-primary text-white hover:bg-primary-600",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        outline:   "border border-border bg-white text-gray-700 hover:bg-gray-50",
        ghost:     "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        link:      "text-primary underline-offset-4 hover:underline",
        accent:    "bg-accent text-white hover:opacity-90",
        success:   "bg-success text-white hover:opacity-90",
      },
      size: {
        default: "h-9 px-4 py-2 rounded",
        sm:      "h-7 px-3 text-xs rounded",
        lg:      "h-11 px-6 rounded",
        icon:    "h-9 w-9 rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
