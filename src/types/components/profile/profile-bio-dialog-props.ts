export type ProfileBioDialogProps = {
  /** Opened by the page (from the "Editar perfil" menu). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** HTML atual da bio (nulo quando a pessoa usa a bio de texto). */
  initialHtml: string | null;
  onSaved: () => void;
};
