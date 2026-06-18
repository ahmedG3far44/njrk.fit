import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./utils";

const variantStyles = {
  primary:
    "bg-green-900/80 hover:bg-green-800 text-green-300 border border-green-700/50 shadow-sm transition-all duration-200",
  secondary:
    "bg-card text-card-foreground border border-border hover:bg-muted active:bg-muted",
  destructive:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm hover:shadow-md",
  ghost:
    "text-muted-foreground hover:bg-muted active:bg-muted",
  outline:
    "bg-transparent text-green-300 border border-green-700/50 hover:bg-green-900/30 active:bg-green-900/50",
} as const;

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1",
  default: "px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm rounded-xl gap-1.5",
  lg: "px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base rounded-xl gap-2",
  xl: "px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base rounded-2xl gap-2",
  icon: "size-9 sm:size-10 rounded-xl",
} as const;

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  asChild?: boolean;
  loading?: boolean;
}

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        "inline-flex items-center justify-center font-bold cursor-pointer",
        "transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        "disabled:opacity-50 disabled:pointer-events-none disabled:scale-100",
        "outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin size-3.5 sm:size-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </Comp>
  );
}

export { Button, variantStyles, sizeStyles };
export type { ButtonProps };
