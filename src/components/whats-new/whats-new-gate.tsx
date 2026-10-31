import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { WhatsNewDialog } from "@rede-enois/design-system/domain";

import { authApi, releaseNotesApi } from "@/lib/api";
import { isNoticeDismissed, noticeShowsModal } from "@/lib/notice-dismissal";
import { hasSession } from "@/lib/require-auth";
import { markWhatsNewSeen, shouldShowWhatsNew } from "@/lib/whats-new";

import { useAdminNotice } from "@/components/notices/admin-notice";

/**
 * "O que há de novo" once per published release, mounted on the root next to the onboarding guard.
 * The release comes from the admin panel (`/novidades/atual`); its `updatedAt` is the version, so a
 * republish opens it again. Shares the `auth-me` query with the onboarding guard and never opens on
 * top of an admin notice popup.
 */
export function WhatsNewGate() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onFeed = pathname === "/feed";
  const [open, setOpen] = useState(false);
  const notice = useAdminNotice();

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
    enabled: onFeed && hasSession(),
    staleTime: 60_000,
  });

  const { data: release } = useQuery({
    queryKey: ["novidades", "atual"],
    queryFn: () => releaseNotesApi.current(),
    enabled: onFeed && hasSession(),
    // A release changes by publication, not by time: one read per visit is enough.
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    // Dismissal is read from storage, so after closing an admin notice this opens on the next
    // navigation or visit, not in the same second. Fine for a once-per-release popup.
    const noticePending =
      !!notice && noticeShowsModal(notice.surface) && !isNoticeDismissed("modal", notice);
    if (!noticePending && shouldShowWhatsNew(pathname, user, release?.updatedAt)) setOpen(true);
  }, [pathname, user, release, notice]);

  if (!release) return null;

  return (
    <WhatsNewDialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        markWhatsNewSeen(release.updatedAt);
        setOpen(false);
      }}
      items={release.items.map((item, index) => ({ id: String(index), ...item }))}
    />
  );
}
