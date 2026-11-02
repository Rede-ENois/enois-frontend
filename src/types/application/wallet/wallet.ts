import type { Streak } from "../streak/streak";
import type { WalletEntry } from "./wallet-entry";

export type Wallet = {
  balance: number;
  escala: number;
  cotacaoBrlCents: number;
  /** Precisão real da cotação: micro-reais por faísca. */
  cotacaoBrlMicros: number;
  chave: string;
  entries: WalletEntry[];
  /** Ausente em backend sem a sequência diária. */
  streak?: Streak | null;
};
