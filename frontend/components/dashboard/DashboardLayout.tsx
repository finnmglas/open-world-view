"use client";

import { useState } from "react";
import { Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobeView } from "@/components/dashboard/GlobeView";

interface DashboardLayoutProps {
  /** Server or client nodes rendered inside the collapsible side panel */
  panels: React.ReactNode;
}

export function DashboardLayout({ panels }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Globe fills entire viewport */}
      <GlobeView />

      {/* FAB — top-left, always visible */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          className="bg-black/60 border-white/10 text-white hover:bg-white/10 backdrop-blur-sm"
          aria-label={open ? "Hide panels" : "Show panels"}
        >
          {open ? <X className="size-4" /> : <Layers className="size-4" />}
        </Button>
      </div>

      {/* Side panel — slides in from left */}
      <div
        className={[
          "absolute top-4 left-16 z-10 flex flex-col gap-4",
          "max-h-[calc(100vh-2rem)] overflow-y-auto",
          "transition-all duration-200 ease-in-out",
          open
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-4 pointer-events-none",
        ].join(" ")}
      >
        {panels}
      </div>
    </div>
  );
}
