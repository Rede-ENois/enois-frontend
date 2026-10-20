import { useEffect, useState } from "react";

import { texts } from "@/texts";
import { Bell, BellRing, Loader2 } from "lucide-react";

import { pushApi } from "@/lib/api/push";
import { disablePush, enablePush, isPushActive, isPushSupported } from "@/lib/push";
import { cn } from "@/lib/utils";

const ITEM_CLASS =
  "flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-normal text-text-strong transition hover:bg-surface-2 disabled:opacity-50";

/**
 * Liga/desliga as notificacoes push neste dispositivo. Fica escondido quando o servidor nao tem
 * VAPID configurado ou o navegador nao suporta — nesses casos a opcao so confundiria.
 */
export function PushToggle({ onClose }: { onClose: () => void }) {
  const [available, setAvailable] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    let cancelled = false;

    void (async () => {
      try {
        const config = await pushApi.config();
        if (cancelled || !config.enabled || !config.publicKey) return;
        const subscribed = await isPushActive();
        if (cancelled) return;
        setActive(subscribed);
        setAvailable(true);
      } catch {
        // Sem o backend nao ha como inscrever; simplesmente nao mostramos a opcao.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!available) return null;

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (active) {
        await disablePush();
        setActive(false);
      } else {
        const result = await enablePush();
        if (result.ok) {
          setActive(true);
          onClose();
        } else if (result.reason === "denied") {
          setError(texts.account.menu.pushDenied);
        } else if (result.reason === "unsupported") {
          setError(texts.account.menu.pushUnavailable);
        } else if (result.reason === "server-disabled" || result.reason === "unreachable") {
          setError(texts.account.menu.pushServerOff);
        } else {
          setError(texts.account.menu.pushError);
        }
      }
    } catch {
      setError(texts.account.menu.pushError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={toggle} disabled={busy} className={ITEM_CLASS}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : active ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}

        <span>
          {busy
            ? texts.account.menu.pushWorking
            : active
              ? texts.account.menu.pushOn
              : texts.account.menu.pushOff}
        </span>
      </button>

      {error && <p className={cn("px-4 pb-2 text-xs text-destructive")}>{error}</p>}
    </div>
  );
}
