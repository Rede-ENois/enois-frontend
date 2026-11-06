import type { ComponentPropsWithoutRef, ElementType } from "react";

export type ComposerActionProps = {
  icon: ElementType;
  label: string;
  /** Tooltip; sem ele o rótulo acessível também serve de dica. */
  title?: string;
  active?: boolean;
  disabled?: boolean;
  /** Abre um diálogo (figurinhas): anuncia `aria-haspopup` em vez de um estado pressionado. */
  dialog?: boolean;
  onClick: NonNullable<ComponentPropsWithoutRef<"button">["onClick"]>;
};
