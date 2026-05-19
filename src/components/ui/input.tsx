import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-slate-200 bg-card px-3 py-2 text-sm font-normal text-foreground placeholder:font-normal placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
