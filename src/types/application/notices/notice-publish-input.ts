import type { NoticeSurface } from "@/types/application/notices/notice-surface";

/** O que o painel de admin manda para publicar (ou reescrever) o aviso vigente. */
export type NoticePublishInput = {
  title: string;
  bodyHtml: string;
  surface: NoticeSurface;
};
