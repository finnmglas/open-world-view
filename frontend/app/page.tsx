import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PingCard } from "@/components/dashboard/PingCard";
import { ViewStatePanel } from "@/components/dashboard/ViewStatePanel";
import { WsDebugCard } from "@/components/dashboard/WsDebugCard";
import { ShortcutsCard } from "@/components/dashboard/ShortcutsCard";

export default function Home() {
  return (
    <DashboardLayout
      panels={
        <div className="flex flex-col gap-4 w-80">
          <Suspense
            fallback={
              <div className="w-full rounded border border-border bg-card p-6">
                <p className="text-xs font-mono text-muted-foreground animate-pulse">
                  connecting to backend…
                </p>
              </div>
            }
          >
            <PingCard />
          </Suspense>
          <WsDebugCard />
          <ViewStatePanel />
          <ShortcutsCard />
        </div>
      }
    />
  );
}
