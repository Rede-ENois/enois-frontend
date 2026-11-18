import type { AdminMemberRow } from "./admin-member-row";

/** Página da lista administrativa de membros, com o total que a busca alcançou. */
export type AdminMemberPage = {
  entityId: string;
  name: string;
  total: number;
  page: number;
  size: number;
  pages: number;
  items: AdminMemberRow[];
};
