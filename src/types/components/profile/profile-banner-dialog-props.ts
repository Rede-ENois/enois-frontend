export type ProfileBannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** HTML atual da capa (nulo quando a pessoa usa a foto ou o degradê padrão). */
  initialHtml: string | null;
  /** Abre o seletor de arquivo da foto: a capa continua tendo as duas formas. */
  onPickPhoto: () => void;
  onSaved: () => void;
  /** Equipped shop banner (`banner-*`): it draws over the own cover until it comes off. */
  bannerItem?: string | null;
};
