import { useEffect, useState } from "react";

import { texts } from "@/texts";
import { X } from "lucide-react";

import { useSaciDuel } from "@/lib/use-saci-events";

import { SaciDuelPanel } from "./saci-duel-panel";

const DISMISS_KEY = "enois-saci-duel-dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** The duel on the feed while it is open; closing it hides it on this device. */
export function SaciDuelBanner() {
  const { duel } = useSaciDuel();
  // Starts hidden and reads the device choice after mount: the server cannot see localStorage.
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => setDismissed(readDismissed()), []);

  if (dismissed || !duel.data?.active) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ponytail: storage blocked (private mode) only means the banner comes back next visit.
    }
  };

  return (
    <div className="relative">
      <SaciDuelPanel />

      <button
        type="button"
        onClick={dismiss}
        title={texts.cosmetics.duelBannerDismiss}
        aria-label={texts.cosmetics.duelBannerDismiss}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-text-strong"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
