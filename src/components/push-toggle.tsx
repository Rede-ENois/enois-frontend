import { useEffect, useState } from "react";

import { texts } from "@/texts";
import { PushToggle as PushToggleView } from "@rede-enois/design-system/domain";

import { pushApi } from "@/lib/api/push";
import { disablePush, enablePush, isPushActive, isPushSupported } from "@/lib/push";

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

  return <PushToggleView active={active} busy={busy} error={error} onToggle={toggle} />;
}
