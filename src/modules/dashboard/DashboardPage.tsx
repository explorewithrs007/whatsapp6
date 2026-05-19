import { AppIcons } from "@/components/icons";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { CardGridSkeleton, ListSkeleton } from "@/components/LoadingStates";
import { MetricCard } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useMockLoading } from "@/hooks/useMockLoading";
import {
  activityFeed,
  agentPerformance,
  conversationSummary,
  type AgentPerformance,
} from "@/modules/dashboard/dashboard.data";

const metricIcons = [AppIcons.liveChat, AppIcons.clock, AppIcons.statusComplete, AppIcons.whatsappInbox];

const agentColumns: DataTableColumn<AgentPerformance>[] = [
  {
    key: "agent",
    header: "Agent",
    cell: (row) => (
      <UserAvatar
        initials={row.agent
          .split(" ")
          .map((part) => part[0])
          .join("")}
        name={row.agent}
      />
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge category="user" status={row.status} />,
  },
  {
    key: "chatsHandled",
    header: "Chats Handled",
    cell: (row) => row.chatsHandled,
  },
  {
    key: "responseTime",
    header: "Response Time",
    cell: (row) => row.responseTime,
  },
];

type DashboardPageProps = {
  onOpenMessageStatus?: () => void;
};

export function DashboardPage({ onOpenMessageStatus }: DashboardPageProps) {
  const isLoading = useMockLoading();

  return (
    <div className="flex w-full flex-col gap-4">
      {isLoading ? (
        <CardGridSkeleton />
      ) : (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {conversationSummary.map((metric, index) => (
          <MetricCard
            key={metric.title}
            icon={metricIcons[index]}
            onClick={metric.title === "WhatsApp Message Volume" ? onOpenMessageStatus : undefined}
            title={metric.title}
            tone={index === 1 ? "amber" : "green"}
            value={metric.value}
          />
        ))}
      </section>
      )}

      <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <SectionCard className="flex h-[min(46vh,440px)] min-h-[360px] flex-col">
          <div className="mb-4 shrink-0 flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">Agent Performance</h2>
            <p className="text-sm text-muted-foreground">Agent activity and response metrics.</p>
          </div>
          <div className="subtle-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <DataTable columns={agentColumns} data={agentPerformance} getRowId={(row) => row.agent} loading={isLoading} />
          </div>
        </SectionCard>

        <SectionCard className="flex h-[min(46vh,440px)] min-h-[360px] flex-col">
          <div className="mb-4 shrink-0 flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">Activity Feed</h2>
            <p className="text-sm text-muted-foreground">Recent workspace events.</p>
          </div>
          <div className="subtle-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {isLoading ? (
              <ListSkeleton rows={4} />
            ) : activityFeed.length ? (
            activityFeed.map((item) => (
              <div key={`${item.title}-${item.time}`} className="flex gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-whatsapp" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <span className="shrink-0 text-xs text-muted">{item.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <div className="mt-2">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>
            ))
            ) : (
              <EmptyState compact variant="activity" />
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
