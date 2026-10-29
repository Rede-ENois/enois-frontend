import type { AdminNotice } from "@/types/application/notices/admin-notice";
import type { NoticeSurface } from "@/types/application/notices/notice-surface";
import type { NoticeSlot } from "@/types/lib/notice-slot";

/**
 * Dispensa do aviso da plataforma, guardada no aparelho.
 *
 * A chave e (id + updatedAt), e nao um "avisos de hoje": reescrever o aviso muda a data, entao quem
 * ja tinha fechado a versao antiga volta a ver o recado corrigido — que e o comportamento esperado
 * de um aviso reeditado. A dispensa velha fica no localStorage e deixa de casar, sem limpeza e sem
 * servidor.
 */
const PREFIX = "enois:aviso";

export function noticeShowsBanner(surface: NoticeSurface): boolean {
  return surface === "BANNER" || surface === "BOTH";
}

export function noticeShowsModal(surface: NoticeSurface): boolean {
  return surface === "MODAL" || surface === "BOTH";
}

function versionOf(notice: AdminNotice): string {
  return `${notice.id}:${notice.updatedAt}`;
}

/** `true` quando a pessoa ja fechou ESTA versao nesta superficie. Sem localStorage, o aviso aparece. */
export function isNoticeDismissed(slot: NoticeSlot, notice: AdminNotice): boolean {
  try {
    return localStorage.getItem(`${PREFIX}:${slot}`) === versionOf(notice);
  } catch {
    return false;
  }
}

export function dismissNotice(slot: NoticeSlot, notice: AdminNotice): void {
  try {
    localStorage.setItem(`${PREFIX}:${slot}`, versionOf(notice));
  } catch {
    // Modo privado: a pessoa fecha agora e o aviso volta no proximo acesso. Nunca quebrar a tela.
  }
}
