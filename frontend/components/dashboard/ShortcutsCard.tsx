"use client";

import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";

type ShortcutRow = {
  keys: string[];
  label: string;
  note?: string;
};

type ShortcutSection = {
  title: string;
  rows: ShortcutRow[];
};

const SECTIONS: ShortcutSection[] = [
  {
    title: "Navigate",
    rows: [
      { keys: ["W", "↑"], label: "Move north" },
      { keys: ["S", "↓"], label: "Move south" },
      { keys: ["A", "←"], label: "Move west" },
      { keys: ["D", "→"], label: "Move east" },
      { keys: ["E"], label: "Rotate clockwise" },
      { keys: ["Q"], label: "Rotate counter-clockwise" },
      { keys: ["Shift", "+any"], label: "4× speed", note: "hold" },
    ],
  },
  {
    title: "Zoom",
    rows: [
      { keys: ["+", "="], label: "Zoom in" },
      { keys: ["-"], label: "Zoom out" },
    ],
  },
  {
    title: "Go to… (chord)",
    rows: [
      { keys: ["g", "p"], label: "Paris" },
      { keys: ["g", "l"], label: "London" },
      { keys: ["g", "n"], label: "New York" },
      { keys: ["g", "t"], label: "Tokyo" },
      { keys: ["g", "s"], label: "Sydney" },
      { keys: ["g", "b"], label: "Berlin" },
      { keys: ["g", "d"], label: "Dubai" },
      { keys: ["g", "r"], label: "Rio" },
      { keys: ["g", "m"], label: "Mumbai" },
      { keys: ["g", "k"], label: "Nairobi" },
      { keys: ["g", "c"], label: "Cape Town" },
      { keys: ["g", "i"], label: "Istanbul" },
      { keys: ["g", "h"], label: "Home view" },
    ],
  },
  {
    title: "Global",
    rows: [
      { keys: ["⌃K"], label: "Command palette" },
      { keys: ["⌃D"], label: "Toggle dark / light" },
      { keys: ["?"], label: "Toggle panels" },
    ],
  },
];

function ShortcutRow({ keys, label, note }: ShortcutRow) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[10px] text-muted-foreground/40">then</span>}
            <Kbd className="text-[10px] px-1.5 py-0.5">{k}</Kbd>
          </span>
        ))}
        {note && <span className="text-[10px] text-muted-foreground/50 ml-1">{note}</span>}
      </div>
    </div>
  );
}

export function ShortcutsCard() {
  return (
    <div className="w-full rounded border border-border bg-card p-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        Keyboard shortcuts
      </p>

      {SECTIONS.map((section, i) => (
        <div key={section.title} className="space-y-0.5">
          {i > 0 && <Separator className="mb-2" />}
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1">
            {section.title}
          </p>
          {section.rows.map((row) => (
            <ShortcutRow key={row.label} {...row} />
          ))}
        </div>
      ))}
    </div>
  );
}
