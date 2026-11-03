import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { NotificationsPopover as NotificationsPopoverView } from "@rede-enois/design-system/domain";

import { notificationsApi } from "@/lib/api";
import { useInterfaceContext } from "@/lib/interface-context";
import { useIsAuthenticated } from "@/lib/use-auth";

import { useNotificationsPanel } from "./notifications/use-notifications-panel";

/** The bell: the latest notices of the active interface, with a link to the full page. */
export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const authenticated = useIsAuthenticated();

  // The bell follows the active interface: work notices in the professional one, community ones in
  // the social one, account-wide ones (security, moderation) in both.
  const context = useInterfaceContext();
  const { data } = useQuery({
    queryKey: ["notifications", context],
    queryFn: () => notificationsApi.list(null, 20, context),
    enabled: authenticated,
    staleTime: 30_000,
  });

  const panel = useNotificationsPanel(data?.items ?? [], {
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
