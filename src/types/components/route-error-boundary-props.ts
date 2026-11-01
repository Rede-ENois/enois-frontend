import type { ReactNode } from "react";

export interface RouteErrorBoundaryProps {
  children: ReactNode;
  /** Chamado antes do reset pra invalidar cache/router. */
  onReset?: () => void;
}
