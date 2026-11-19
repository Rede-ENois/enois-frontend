export type EmotePickerDialogProps = {
  /** Abriu/fechou o seletor: ao fechar, o campo de escrita recebe o cursor de volta. */
  onOpenChange?: (open: boolean) => void;
  /** Escolheu uma figurinha: o código entra no texto (`:KEKW:`). */
  onSelect: (code: string) => void;
};
