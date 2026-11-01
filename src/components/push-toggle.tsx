import { useEffect, useState } from "react";

import { texts } from "@/texts";
import { PushToggle as PushToggleView } from "@rede-enois/design-system/domain";

import { pushApi } from "@/lib/api/push";
import {
  disablePush,
  enablePush,
  isPushActive,
  isPushSupported,
  pushErrorMessage,
  pushPermission,
} from "@/lib/push";

/**
 * Liga/desliga as notificacoes push neste dispositivo. Fica escondido quando o servidor nao tem
 * VAPID configurado ou o navegador nao suporta — nesses casos a opcao so confundiria.
 *
 * Com a permissao ja negada pelo navegador nao ha o que ligar por aqui: o pedido nao abre de novo.
 * A opcao aparece travada, com a instrucao de liberar nas configuracoes, em vez de um botao que
 * falha em silencio.
 */
export function PushToggle({ onClose }: { onClose: () => void }) {
  const [available, setAvailable] = useState(false);
  const [active, setActive] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    let cancelled = false;

    void (async () => {
      try {
        const config = await pushApi.config();
        if (cancelled || !config.enabled || !config.publicKey) return;
        // Inscreve so se a inscricao existente ainda vale para a chave que o servidor anuncia.
        const subscribed = await isPushActive(config.publicKey);
        if (cancelled) return;
        setActive(subscribed);
        setBlocked(pushPermission() === "denied");
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

  if (blocked) {
    return (
      <p className="px-4 pb-2 text-xs text-muted-foreground">{texts.account.menu.pushDenied}</p>
    );
  }

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
        } else {
          if (result.reason === "denied") setBlocked(true);
          setError(pushErrorMessage(result.reason));
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
