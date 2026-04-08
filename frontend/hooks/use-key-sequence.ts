"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SequenceMap = Record<string, () => void>;

function isTyping(): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}

/**
 * Keyboard chord / sequence hook.
 *
 * Usage:
 *   useKeySequence({ "gt": () => flyTo(tokyo), "gp": () => flyTo(paris) })
 *
 * - Sequences are matched greedily: pressing "g" then "t" within `timeout` ms
 *   fires the "gt" handler.
 * - If a key doesn't continue any sequence, the buffer resets with that key.
 * - Returns `buffer` — the currently accumulated sequence, useful for UI hints.
 * - Ignores events when the user is typing in an input.
 */
export function useKeySequence(sequences: SequenceMap, timeout = 1200) {
  const [buffer, setBuffer] = useState("");
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep sequences in a ref so the effect closure doesn't go stale when the
  // caller passes a new object reference each render.
  const seqRef = useRef(sequences);
  useEffect(() => { seqRef.current = sequences; }, [sequences]);

  const reset = useCallback(() => {
    bufferRef.current = "";
    setBuffer("");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const scheduleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(reset, timeout);
  }, [reset, timeout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when modifier keys are held (let other shortcuts fire)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Ignore when user is typing in a text field
      if (isTyping()) return;
      // Only handle printable single characters
      if (e.key.length !== 1) return;

      const next = bufferRef.current + e.key;
      const seqs = seqRef.current;

      // Check if any registered sequence starts with `next`
      const hasPrefix = Object.keys(seqs).some((s) => s.startsWith(next));
      // Check for exact match
      const exact = seqs[next];

      if (exact) {
        e.preventDefault();
        exact();
        // Tell keyboard-controls to release/block the completing key so it
        // doesn't also trigger movement (e.g. "gd" → Dubai should not move east).
        window.dispatchEvent(new CustomEvent("sequence-consumed", { detail: e.key }));
        reset();
        return;
      }

      if (hasPrefix) {
        e.preventDefault();
        bufferRef.current = next;
        setBuffer(next);
        scheduleReset();
        return;
      }

      // No match at all — try starting a fresh sequence with just this key
      const freshPrefix = Object.keys(seqs).some((s) => s.startsWith(e.key));
      if (freshPrefix) {
        e.preventDefault();
        bufferRef.current = e.key;
        setBuffer(e.key);
        scheduleReset();
      } else {
        reset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reset, scheduleReset]);

  return { buffer };
}
