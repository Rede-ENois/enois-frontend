import { useEffect, useState } from "react";

import { texts } from "@/texts";
import type { PushState } from "@/types/components/notifications/push-state";
import { useToast } from "@rede-enois/design-system/ui";

import { pushApi } from "@/lib/api/push";
import {
  disablePush,
  enablePush,
  isPushActive,
  isPushSupported,
  pushErrorMessage,
  pushPermission,
  syncPushSubscription,
} from "@/lib/push";

/**
 * Avisos no navegador deste aparelho.
 *
 * A inscrição vale para a chave que o servidor anuncia HOJE: uma presa à chave antiga conta
 * como desligada (e é trocada no próximo "ligar") em vez de esconder a opção. Sem VAPID no
 * servidor ou navegador sem suporte não há o que oferecer (`available` fica falso).
 */
export function usePushState(): PushState {
  const { toast } = useToast();
  const [active, setActive] = useState(false);
  const [available, setAvailable] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    let cancelled = false;

    void (async () => {
      try {
        const config = await pushApi.config();
        if (cancelled || !config.enabled || !config.publicKey) return;
        const subscribed = await isPushActive(config.publicKey);
        if (subscribed) {
          // Inscrição local viva cuja linha sumiu do servidor: repõe antes de mostrar "ligado".
          void syncPushSubscription(config.publicKey).catch(() => undefined);
        }
        if (cancelled) return;
        setActive(subscribed);
        setDenied(pushPermission() === "denied");
        setAvailable(true);
      } catch {
        // Sem a configuração não dá para inscrever: a opção simplesmente não aparece.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (active) {
        await disablePush();
        setActive(false);
        return;
      }
      const result = await enablePush();
      if (result.ok) {
        setActive(true);
      } else {
        if (result.reason === "denied") setDenied(true);
        toast(pushErrorMessage(result.reason), "error");
      }
    } catch {
      toast(texts.account.menu.pushError, "error");
    } finally {
      setBusy(false);
    }
  };

  return {
    active,
    available,
    denied,
    busy,
    toggle: () => void toggle(),
  };
}
