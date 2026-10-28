import { useEffect, useRef, useState } from "react";

import { HealthyUsageReminder } from "@rede-enois/design-system/domain";

import { readHealthyUsage, subscribeHealthyUsage } from "@/lib/healthy-usage";

/**
 * Conta o tempo da SESSÃO (recarregar zera) e mostra o lembrete quando o limite configurado
 * chega. Fica montado no root para continuar correndo em qualquer página do app.
 */
export function HealthyUsageGuard() {
  const [config, setConfig] = useState(readHealthyUsage);
  const [open, setOpen] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const update = () => setConfig(readHealthyUsage());
    return subscribeHealthyUsage(update);
  }, []);

  // Mudar o intervalo nas configurações reinicia a contagem — vale para a próxima pausa.
  useEffect(() => {
    startedAt.current = Date.now();
    if (!config.enabled) setOpen(false);
  }, [config.enabled, config.minutes]);

  useEffect(() => {
    if (!config.enabled) return;
    const limitMs = config.minutes * 60_000;
    const check = () => {
      if (Date.now() - startedAt.current >= limitMs) {
        startedAt.current = Date.now();
        setOpen(true);
      }
    };
    check();
    // O intervalo pode ser estrangulado em aba de fundo; a conta é pelo relógio, não pelos ticks.
    const timer = window.setInterval(check, 5000);
    return () => window.clearInterval(timer);
  }, [config.enabled, config.minutes]);

  const dismiss = () => {
    startedAt.current = Date.now();
    setOpen(false);
  };

  return (
    <HealthyUsageReminder
      open={open}
      onDismiss={dismiss}
      brandIconUrl="/icons/brand-icon-192.png"
    />
  );
}
