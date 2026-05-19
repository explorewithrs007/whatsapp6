import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = HTMLAttributes<HTMLDivElement>;

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn("bg-card px-4 py-4 first:pt-4 2xl:px-5 2xl:py-5", className)}
    {...props}
  />
));

SectionCard.displayName = "SectionCard";
