import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { CHANGELOG_RELEASES, LATEST_CHANGELOG_VERSION } from "@/constants/changelog";
import type { ChangelogRelease } from "@/types/application/changelog/changelog-release";
import type { Personalization } from "@/types/application/preferences/personalization";

import { authApi, preferencesApi, releaseNotesApi } from "@/lib/api";
import { isNoticeDismissed, noticeShowsModal } from "@/lib/notice-dismissal";
import { hasSession } from "@/lib/require-auth";
import { usePersonalization } from "@/lib/use-personalization";
import { shouldShowWhatsNew } from "@/lib/whats-new";

import { useAdminNotice } from "@/components/notices/use-admin-notice";

import { WhatsNewModal } from "./whats-new-modal";

/**
 * Gate de novidades montado na raiz da aplicação.
 * Exibe as novas features e melhorias de layout/design system no primeiro acesso ou a cada
 * nova versão, respeitando a configuração de desativação na conta do usuário.
 */
export function WhatsNewGate() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onFeed = pathname === "/feed";
  const [open, setOpen] = useState(false);
  const notice = useAdminNotice();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
    enabled: onFeed && hasSession(),
    staleTime: 60_000,
  });

  const { data: personalization } = usePersonalization();

  const { data: adminRelease } = useQuery({
    queryKey: ["novidades", "atual"],
    queryFn: () => releaseNotesApi.current(),
    enabled: onFeed && hasSession(),
    staleTime: 5 * 60_000,
    retry: false,
  });

  // Consolidação entre changelog versionado e notas do admin.
  // A versão dispensada é a versão estável do changelog versionado no código;
  // notas dinâmicas do admin somam itens ao modal sem rebobinar a dispensa de quem já viu.
  const { currentVersion, activeRelease } = useMemo(() => {
    const baseRelease = CHANGELOG_RELEASES[0] ?? {
      version: LATEST_CHANGELOG_VERSION,
      date: "Novembro 2026",
      title: "Novidades do É-Nóis",
      description: "Confira as atualizações mais recentes do sistema.",
      items: [],
    };

    const version = baseRelease.version;

    if (!adminRelease || !adminRelease.items || adminRelease.items.length === 0) {
      return {
        currentVersion: version,
        activeRelease: baseRelease,
      };
    }

    const combined: ChangelogRelease = {
      ...baseRelease,
      items: [
        ...adminRelease.items.map((item, idx) => ({
          id: `admin-${idx}`,
          title: item.title,
          tag: "Destaque",
          description: item.description,
        })),
        ...baseRelease.items,
      ],
    };

    return { currentVersion: version, activeRelease: combined };
  }, [adminRelease]);

  // Mutation para ligar/desligar alertas de novidades no perfil
  const toggleEnabled = useMutation({
    mutationFn: (enabled: boolean) =>
      preferencesApi.setPersonalization({ whatsNewEnabled: enabled }),
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: ["personalization"] });
      const previous = queryClient.getQueryData<Personalization>(["personalization"]);
      queryClient.setQueryData<Personalization>(["personalization"], (cur) =>
        cur ? { ...cur, whatsNewEnabled: enabled } : cur,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["personalization"], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["personalization"] });
    },
  });

  // Mutation para registrar a dispensa da versão na conta
  const dismissMutation = useMutation({
    mutationFn: (version: string) => preferencesApi.dismissWhatsNew(version),
    onMutate: async (version) => {
      await queryClient.cancelQueries({ queryKey: ["personalization"] });
      const previous = queryClient.getQueryData<Personalization>(["personalization"]);
      queryClient.setQueryData<Personalization>(["personalization"], (cur) =>
        cur ? { ...cur, whatsNewLastSeen: version } : cur,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["personalization"], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["personalization"] });
    },
  });

  // Abre automaticamente quando preenche os critérios
  useEffect(() => {
    const noticePending =
      !!notice && noticeShowsModal(notice.surface) && !isNoticeDismissed("modal", notice);

    if (!noticePending && shouldShowWhatsNew(pathname, user, currentVersion, personalization)) {
      setOpen(true);
    }
  }, [pathname, user, currentVersion, personalization, notice]);

  const handleDismiss = () => {
    setOpen(false);
    if (hasSession()) {
      dismissMutation.mutate(currentVersion);
    }
  };

  return (
    <WhatsNewModal
      open={open}
      onOpenChange={(next) => {
        if (!next) handleDismiss();
        else setOpen(true);
      }}
      release={activeRelease}
      whatsNewEnabled={personalization?.whatsNewEnabled ?? true}
      onToggleWhatsNewEnabled={(enabled) => toggleEnabled.mutate(enabled)}
    />
  );
}
