import { useState } from "react";

import { NotificationsPopover as NotificationsPopoverView } from "@rede-enois/design-system/domain";

import { useInterfaceContext } from "@/lib/interface-context";
import { useIsAuthenticated } from "@/lib/use-auth";

import { useNotificationsList } from "./notifications/use-notifications-list";
import { useNotificationsPanel } from "./notifications/use-notifications-panel";

/** The bell: the latest notices of the active interface, with a link to the full page. */
export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const authenticated = useIsAuthenticated();

  // The bell follows the active interface: work notices in the professional one, community ones in
  // the social one, account-wide ones (security, moderation) in both.
  const context = useInterfaceContext();
  // A mesma lista da página /notificacoes (uma chave, um fetch): o sino mostra a primeira página e
  // quem chega segundo — dock no celular, sino no desktop — reusa o cache em vez de pedir outra
  // cópia ao servidor.
  const { latest } = useNotificationsList(context, authenticated);

  const panel = useNotificationsPanel(latest, {
    requestsEnabled: open,
    // Fecha o popover: aberto, ele cobria a pagina e dava a impressao de que o clique "sumia com a
    // notificacao" sem levar ao destino.
    onOpened: () => setOpen(false),
  });

  return (
    <NotificationsPopoverView
      {...panel}
      open={open}
      onOpenChange={setOpen}
      allHref="/notificacoes"
    />
  );
}
