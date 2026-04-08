import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PingCard } from "@/components/dashboard/PingCard";
import { ViewSettingsPanel } from "@/components/dashboard/ViewSettingsPanel";
import { ViewStatePanel } from "@/components/dashboard/ViewStatePanel";
import { WsDebugCard } from "@/components/dashboard/WsDebugCard";
import { ShortcutsCard } from "@/components/dashboard/ShortcutsCard";

export default function Home() {
  return (
    <DashboardLayout
      panels={
        <div className="flex flex-col gap-4 w-100 pr-3">
          <ViewSettingsPanel />
          <ViewStatePanel />
          <ShortcutsCard />
          <WsDebugCard />
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
        </div>
      }
    />
  );
}
