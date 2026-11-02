import type { PostTypePickerOption } from "@/types/components/feed/post-type-picker-option";

export type PostTypePickerProps = {
  /** Tipos disponíveis para a identidade ativa. */
  options: readonly PostTypePickerOption[];
  /** Tipo selecionado no momento. */
  value: string;
  onChange: (id: string) => void;
};
