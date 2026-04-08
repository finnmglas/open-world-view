"use client";

import { useCallback, useState } from "react";
import { Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useViewStore } from "@/hooks/view-store";

// Both globe backends — client-side only
const CesiumView = dynamic(
  () => import("@/components/dashboard/CesiumView").then((m) => ({ default: m.CesiumView })),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-black" /> },
);
const GlobeView = dynamic(
  () => import("@/components/dashboard/GlobeView").then((m) => ({ default: m.GlobeView })),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-black" /> },
);

import { KeyboardController } from "@/components/keyboard-controller";
import { CommandPalette } from "@/components/command-palette";
import { SequenceHint } from "@/components/sequence-hint";

interface DashboardLayoutProps {
  panels: React.ReactNode;
}

export function DashboardLayout({ panels }: DashboardLayoutProps) {
  const [panelsOpen, setPanelsOpen]   = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const globeType = useViewStore((s) => s.globeType);

  const togglePanels       = useCallback(() => setPanelsOpen((v) => !v), []);
  const openCommandPalette = useCallback(() => setPaletteOpen(true), []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Globe fills entire viewport */}
      {globeType === "cesium" ? <CesiumView /> : <GlobeView />}

      {/* Keyboard controller — mounts all keyboard hooks, renders nothing */}
      <KeyboardController
        onOpenCommandPalette={openCommandPalette}
        onTogglePanels={togglePanels}
      />

      {/* Ctrl+K command palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onTogglePanels={togglePanels}
      />

      {/* Sequence chord hint (bottom-center) */}
      <SequenceHint />

      {/* FAB — top-left */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          size="icon"
          variant="outline"
          onClick={togglePanels}
          className="bg-background!"
          aria-label={panelsOpen ? "Hide panels" : "Show panels"}
        >
          {panelsOpen ? <X className="size-4" /> : <Layers className="size-4" />}
        </Button>
      </div>

      {/* Side panels — slide in from left */}
      <div
        className={[
          "absolute top-4 left-16 z-10 flex flex-col gap-4",
          "max-h-[calc(100vh-2rem)] overflow-y-auto pr-1",
          "transition-all duration-200 ease-in-out",
          panelsOpen
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-4 pointer-events-none",
        ].join(" ")}
      >
        {panels}
      </div>
    </div>
  );
}
