import type { ReactNode } from "react";
import { Header } from "@/layout/Header";
import { Sidebar } from "@/layout/Sidebar";
import { cn } from "@/lib/utils";

type AppShellProps = {
  activePath: string;
  children: ReactNode;
  onNavigate?: (path: string) => void;
};

export function AppShell({ activePath, children, onNavigate }: AppShellProps) {
  const isWorkspacePage = activePath === "whatsapp-inbox";

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-screen">
        <Sidebar activePath={activePath} onNavigate={onNavigate} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header onNavigate={onNavigate} />
          <main
            className={cn(
              "min-h-0 flex-1 bg-background",
              isWorkspacePage ? "overflow-hidden p-0" : "subtle-scrollbar overflow-y-auto p-2 lg:p-3",
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
