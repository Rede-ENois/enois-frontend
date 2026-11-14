import { useEffect, useMemo, useRef, useState } from "react";

/** O horário local não define a duração nem a liberação da punição. */
export function useSanctionClock(
  serverNow: string | undefined,
  deadlines: readonly string[],
  refresh: () => void,
  observedAt?: number,
): number | null {
  const anchor = useMemo(() => {
    const instant = serverNow ? Date.parse(serverNow) : Number.NaN;
    return Number.isFinite(instant) ? { instant, observed: observedAt ?? performance.now() } : null;
  }, [serverNow, observedAt]);
  const [tick, setTick] = useState(() => performance.now());
  const refreshed = useRef(new Set<string>());
  const deadlineKey = deadlines.join("|");
  const now = anchor ? anchor.instant + Math.max(0, tick - anchor.observed) : null;

  useEffect(() => {
    if (!anchor) return;
    const timer = window.setInterval(() => setTick(performance.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [anchor]);

  useEffect(() => {
    if (now === null) return;
    const due = deadlineKey.split("|").filter((deadline) => {
      const at = Date.parse(deadline);
      return Number.isFinite(at) && at <= now && !refreshed.current.has(deadline);
    });
    if (due.length === 0) return;
    due.forEach((deadline) => refreshed.current.add(deadline));
    refresh();
  }, [now, deadlineKey, refresh]);

  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [refresh]);

  return now;
}
