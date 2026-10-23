import type { ComponentPropsWithoutRef } from "react";

export type ErrorBannerProps = Pick<ComponentPropsWithoutRef<"div">, "className"> & {
  error: unknown;
  /** Mantém detalhes técnicos fora de fluxos voltados ao usuário final, como login. */
  showDetails?: boolean;
};
