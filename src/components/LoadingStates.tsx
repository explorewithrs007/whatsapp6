import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  rows?: number;
};

export function TableSkeleton({ className, rows = 6 }: SkeletonProps) {
  return (
    <div className={cn("w-full border-y border-slate-200 bg-card", className)}>
      <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.7fr] gap-4 border-b border-slate-200 bg-slate-100/80 px-3 py-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-3" key={index} />
        ))}
      </div>
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.7fr] items-center gap-4 px-3 py-3" key={index}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ className, rows = 6 }: SkeletonProps) {
  return (
    <div className={cn("divide-y divide-slate-200", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div className="flex items-start gap-2.5 px-2 py-3" key={index}>
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="w-20 space-y-2">
            <Skeleton className="ml-auto h-3 w-12" />
            <Skeleton className="ml-auto h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-card", className)}>
      <div className="flex items-center justify-between border-b border-slate-300 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="min-h-0 flex-1 space-y-4 bg-slate-50/80 px-3 py-4">
        <Skeleton className="h-12 w-2/3 rounded-2xl" />
        <Skeleton className="ml-auto h-14 w-3/5 rounded-2xl" />
        <Skeleton className="h-20 w-1/2 rounded-2xl" />
        <Skeleton className="ml-auto h-12 w-2/3 rounded-2xl" />
      </div>
      <div className="border-t border-slate-300 bg-card p-2">
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function DetailPanelSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-5 p-3", className)}>
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="border-t border-slate-200 pt-4" key={index}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ className, rows = 4 }: SkeletonProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-slate-200/70" key={index}>
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ className, rows = 4 }: SkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div className="space-y-2" key={index}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className={index === rows - 1 ? "h-24 w-full rounded-xl" : "h-10 w-full rounded-xl"} />
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}
