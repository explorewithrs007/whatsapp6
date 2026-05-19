import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = HTMLAttributes<HTMLDivElement>;

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn("min-h-0 bg-card px-3 py-3 first:pt-3 lg:px-4 lg:py-4", className)}
    {...props}
  />
));

SectionCard.displayName = "SectionCard";
