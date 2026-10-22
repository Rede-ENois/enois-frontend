import type { BulkBanItemResult } from "./bulk-ban-item-result";

export type BulkBanResult = {
  total: number;
  banned: number;
  alreadyBanned: number;
  failed: number;
  items: BulkBanItemResult[];
  /** IPs fechados junto com o banimento (a conta não volta pelo mesmo caminho). */
  blockedIps: string[];
};
