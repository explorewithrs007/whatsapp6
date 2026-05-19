import { Badge } from "@/components/ui/badge";
import { STATUS_TONES, type StatusCategory, type StatusLabel } from "@/lib/status";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: StatusLabel | string;
  category?: StatusCategory;
};

const toneClasses = {
  green: "border-emerald-300/70 bg-emerald-50 text-emerald-700",
  amber: "border-warning/20 bg-amber-50 text-amber-700",
  red: "border-error/20 bg-red-50 text-error",
  slate: "border-slate-200 bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = STATUS_TONES[status] ?? "slate";

  return <Badge className={cn(toneClasses[tone])}>{status}</Badge>;
}
