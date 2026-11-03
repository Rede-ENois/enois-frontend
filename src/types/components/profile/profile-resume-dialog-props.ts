export type ProfileResumeDialogProps = {
  /** Opened by the page (from the "Editar perfil" menu). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Currículo atual (endereço no storage) e o nome do arquivo, quando existe. */
  resumeUrl?: string | null;
  resumeName?: string | null;
  /** Recarrega o perfil depois de salvar/remover. */
  onSaved: () => void;
};
