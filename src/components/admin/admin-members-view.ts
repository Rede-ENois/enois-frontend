import type { AdminMemberPage } from "@/types/application/admin-entity/admin-member-page";
import type { AdminMemberRowData } from "@rede-enois/design-system/domain";

import { dataHora } from "@/lib/date/format";

/**
 * Tradução da página de membros da API para o modelo da view administrativa.
 *
 * Papel sem tradução aparece como o backend mandou em vez de sumir: um papel novo no servidor não
 * pode esconder a pessoa da lista que a administração precisa ver.
 */
export function adminMemberRows(
  page: AdminMemberPage | undefined,
  roles: Record<string, string>,
): AdminMemberRowData[] {
  return (page?.items ?? []).map((row) => ({
    userId: row.userId,
    username: row.username,
    name: row.name,
    avatar: row.avatar,
    roleLabel: roleLabel(row.role, roles),
    joinedAtLabel: row.joinedAt ? dataHora(row.joinedAt) : "",
  }));
}

export function roleLabel(role: string, roles: Record<string, string>): string {
  return roles[role] ?? role;
}
