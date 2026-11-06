import type { ChangelogRelease } from "@/types/application/changelog/changelog-release";

export type WhatsNewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  release: ChangelogRelease;
  /** Se os alertas automáticos estão ativos na conta do usuário. */
  whatsNewEnabled?: boolean;
  /** Callback para alternar a preferência de avisos automáticos na conta. */
  onToggleWhatsNewEnabled?: (enabled: boolean) => void;
};
