import type { InputHTMLAttributes } from "react";
import { AppIcons } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <AppIcons.search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <Input className="pl-10" type="search" {...props} />
    </div>
  );
}
