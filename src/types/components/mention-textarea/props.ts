import type { ComponentPropsWithoutRef } from "react";

export type Props = Pick<
  ComponentPropsWithoutRef<"textarea">,
  "placeholder" | "className" | "maxLength" | "rows"
> & {
  value: string;
  onChange: (value: string, mentionedUserIds: string[]) => void;
  /** Exibe o contador interno quando há maxLength; padrão: true. */
  showCounter?: boolean;
  /** Mostra a barra de formatacao (negrito, lista, citacao...) acima do campo. */
  toolbar?: boolean;
  /** Imagens coladas no campo (Ctrl+V): o dono do campo decide subir e anexar. */
  onPasteImages?: (files: File[]) => void;
};
