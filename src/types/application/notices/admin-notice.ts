import type { NoticeSurface } from "@/types/application/notices/notice-surface";

/** O aviso vigente da plataforma, escrito por um admin no painel. `null` quando não há aviso no ar. */
export type AdminNotice = {
  id: string;
  title: string;
  /** HTML já sanitizado pelo backend; só entra no quadro isolado. */
  bodyHtml: string;
  surface: NoticeSurface;
  publishedAt: string;
  /** Identidade da versão: fechar o aviso vale até a próxima edição mudar esta data. */
  updatedAt: string;
};
