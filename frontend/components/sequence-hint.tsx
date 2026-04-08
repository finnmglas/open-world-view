"use client";

import { useEffect, useState } from "react";
import { Kbd } from "@/components/ui/kbd";

/**
 * Small floating badge that shows the current key-sequence buffer.
 * Listens for the "sequence-buffer" custom event dispatched by KeyboardController.
 */
export function SequenceHint() {
  const [buffer, setBuffer] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      setBuffer((e as CustomEvent<string>).detail);
    };
    window.addEventListener("sequence-buffer", handler);
    return () => window.removeEventListener("sequence-buffer", handler);
  }, []);

  if (!buffer) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded border border-border bg-card/90 backdrop-blur-sm px-3 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
      <span className="text-xs text-muted-foreground font-mono">sequence</span>
      <div className="flex gap-1">
        {buffer.split("").map((char, i) => (
          <Kbd key={i} className="text-xs">{char}</Kbd>
        ))}
      </div>
      <span className="text-xs text-muted-foreground/50">…</span>
    </div>
  );
}
