import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AppIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

type ToastVariant = "error" | "info" | "loading" | "success" | "warning";

type ToastInput = {
  description?: string;
  title: string;
  variant?: ToastVariant;
};

type ToastItem = Required<Pick<ToastInput, "title" | "variant">> & {
  description?: string;
  id: string;
};

type ToastContextValue = {
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  loading: (title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  toast: (input: ToastInput) => void;
  warning: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastToneClasses: Record<ToastVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-slate-200 bg-white text-slate-700",
  loading: "border-slate-200 bg-white text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item: ToastItem = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "info",
    };

    setToasts((currentToasts) => [item, ...currentToasts].slice(0, 4));
    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((currentToast) => currentToast.id !== id));
    }, input.variant === "loading" ? 1800 : 3200);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      error: (title, description) => toast({ description, title, variant: "error" }),
      info: (title, description) => toast({ description, title, variant: "info" }),
      loading: (title, description) => toast({ description, title, variant: "loading" }),
      success: (title, description) => toast({ description, title, variant: "success" }),
      toast,
      warning: (title, description) => toast({ description, title, variant: "warning" }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-16 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((item) => (
          <ToastCard item={item} key={item.id} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useAppToast must be used inside AppToastProvider");
  }

  return context;
}

function ToastCard({ item }: { item: ToastItem }) {
  const Icon = getToastIcon(item.variant);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border px-3 py-3 text-sm shadow-soft",
        toastToneClasses[item.variant],
      )}
      role="status"
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/70">
        <Icon className={cn("h-4 w-4", item.variant === "loading" && "animate-spin")} />
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{item.title}</span>
        {item.description ? <span className="mt-0.5 block text-xs opacity-80">{item.description}</span> : null}
      </span>
    </div>
  );
}

function getToastIcon(variant: ToastVariant) {
  if (variant === "error") {
    return AppIcons.xStatus;
  }

  if (variant === "success") {
    return AppIcons.statusComplete;
  }

  if (variant === "warning") {
    return AppIcons.statusLimited;
  }

  if (variant === "loading") {
    return AppIcons.refresh;
  }

  return AppIcons.notifications;
}
