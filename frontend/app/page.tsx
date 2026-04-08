import { PingCard } from "@/components/dashboard/PingCard";
import { ViewStatePanel } from "@/components/dashboard/ViewStatePanel";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <PingCard />
      <ViewStatePanel />
    </main>
  );
}
