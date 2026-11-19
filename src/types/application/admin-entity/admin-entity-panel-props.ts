import type { ReactNode } from "react";

/** O bloco administrativo da página: ações destrutivas em cima, lista de membros embaixo. */
export type AdminEntityPanelProps = {
  actions: ReactNode;
  members: ReactNode;
};
