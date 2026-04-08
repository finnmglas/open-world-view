"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Globe, MapPin, Moon, Sun, RotateCcw, Layers } from "lucide-react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { useViewStore } from "@/hooks/view-store";
import { globeAPI } from "@/lib/globe-api";
import { DESTINATIONS } from "@/components/keyboard-controller";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTogglePanels: () => void;
}

export function CommandPalette({ open, onOpenChange, onTogglePanels }: CommandPaletteProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const setPosition = useViewStore((s) => s.setPosition);
  const setZoom     = useViewStore((s) => s.setZoom);
  const reset       = useViewStore((s) => s.reset);

  // Also open via custom event (from KeyboardController)
  useEffect(() => {
    const handler = () => onOpenChange(true);
    window.addEventListener("open-command-palette", handler);
    return () => window.removeEventListener("open-command-palette", handler);
  }, [onOpenChange]);

  const flyTo = (lat: number, lon: number, zoom = 11) => {
    globeAPI.flyTo(lat, lon, zoom);
    setPosition(lat, lon);
    setZoom(zoom);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* --- Navigate --- */}
          <CommandGroup heading="Navigate">
            {Object.entries(DESTINATIONS).map(([key, dest]) => (
              <CommandItem
                key={key}
                value={`go ${dest.label}`}
                onSelect={() => flyTo(dest.lat, dest.lon, dest.zoom)}
              >
                <Globe className="size-3.5 opacity-60" />
                <span>
                  Go to <span className="font-medium">{dest.label}</span>
                </span>
                <CommandShortcut>g {key}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* --- View --- */}
          <CommandGroup heading="View">
            <CommandItem
              value="reset view"
              onSelect={() => {
                reset();
                onOpenChange(false);
              }}
            >
              <RotateCcw className="size-3.5 opacity-60" />
              Reset view
              <CommandShortcut>r</CommandShortcut>
            </CommandItem>

            <CommandItem
              value="toggle panels"
              onSelect={() => {
                onTogglePanels();
                onOpenChange(false);
              }}
            >
              <Layers className="size-3.5 opacity-60" />
              Toggle panels
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>

            <CommandItem
              value="toggle dark light mode theme"
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                onOpenChange(false);
              }}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-3.5 opacity-60" />
              ) : (
                <Moon className="size-3.5 opacity-60" />
              )}
              Toggle {resolvedTheme === "dark" ? "light" : "dark"} mode
              <CommandShortcut>⌃D</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* --- Location info --- */}
          <CommandGroup heading="Current position">
            <CommandItem
              value="copy coordinates"
              onSelect={() => {
                const { lat, lon } = useViewStore.getState();
                navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                onOpenChange(false);
              }}
            >
              <MapPin className="size-3.5 opacity-60" />
              Copy coordinates to clipboard
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
