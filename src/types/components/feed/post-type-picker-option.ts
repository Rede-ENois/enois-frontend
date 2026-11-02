import type { LucideIcon } from "lucide-react";

/** Uma opção do catálogo `POST_TYPES` (o `hint` é do composer, não do seletor). */
export type PostTypePickerOption = {
  id: string;
  label: string;
  icon: LucideIcon;
};
