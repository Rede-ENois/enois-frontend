import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { AdminNotice } from "@/types/application/notices/admin-notice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rede-enois/design-system/ui";
import { X } from "lucide-react";

import { noticesApi } from "@/lib/api";
import {
  dismissNotice,
  isNoticeDismissed,
  noticeShowsBanner,
  noticeShowsModal,
} from "@/lib/notice-dismissal";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * O aviso da plataforma escrito por um admin, no dois formatos: faixa embaixo do cabecalho e popup.
 *
 * O HTML entra sempre pelo `SandboxedHtmlFrame` — e o mesmo quadro do post de pagina, sem
 * `allow-scripts`. Nao ha atalho aqui: o conteudo vem do painel de admin, e painel confiavel nao e
 * fonte de HTML confiavel.
 */
export function useAdminNotice(): AdminNotice | null {
  const { data } = useQuery({
    queryKey: ["avisos", "ativo"],
    queryFn: () => noticesApi.current(),
    // O aviso e raro e muda por publicacao, nao por tempo: uma leitura por visita basta.
    staleTime: 5 * 60_000,
    retry: false,
  });

  return data ?? null;
}

/** Faixa: aparece em toda tela ate a pessoa fechar, porque quem nao rola a pagina nao ve o popup. */
export function AdminNoticeBanner() {
  const notice = useAdminNotice();
  const [closed, setClosed] = useState(false);

  if (
    !notice ||
    !noticeShowsBanner(notice.surface) ||
    closed ||
    isNoticeDismissed("banner", notice)
  ) {
    return null;
  }

  const fechar = () => {
    dismissNotice("banner", notice);
    setClosed(true);
  };

  return (
    <div className="border-b border-border-soft bg-primary-soft">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-1.5 sm:px-6">
        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-primary-text">
          {texts.notices.bannerLabel}
        </p>

        {/* Recorte em altura fixa: a faixa e uma faixa. Um aviso que precisa de mais espaco e um
            aviso de superficie MODAL, e e o admin quem escolhe ao publicar. */}
        <SandboxedHtmlFrame
          html={notice.bodyHtml}
          title={notice.title}
          innerPadding={false}
          clip
          className="h-12 min-w-0 flex-1"
        />

        <button
          type="button"
          onClick={fechar}
          aria-label={texts.notices.close}
          className="shrink-0 rounded-full p-1.5 text-primary-text transition hover:bg-primary/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Popup: abre uma vez por versao do aviso (fechar vale ate a proxima edicao). */
export function AdminNoticeDialog() {
  const notice = useAdminNotice();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!notice || !noticeShowsModal(notice.surface) || isNoticeDismissed("modal", notice)) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [notice]);

  const fechar = () => {
    if (notice) dismissNotice("modal", notice);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) fechar();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{notice?.title}</DialogTitle>

          <DialogDescription className="sr-only">
            {texts.notices.dialogDescription}
          </DialogDescription>
        </DialogHeader>

        {notice && (
          <SandboxedHtmlFrame
            html={notice.bodyHtml}
            title={notice.title}
            maxHeight={480}
            className="rounded-xl border border-border-soft"
          />
        )}

        <p className="text-xs text-text-subtle">{texts.notices.publishedOn(notice?.publishedAt)}</p>

        <button
          type="button"
          onClick={fechar}
          className="self-start rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          {texts.notices.closeButton}
        </button>
      </DialogContent>
    </Dialog>
  );
}
