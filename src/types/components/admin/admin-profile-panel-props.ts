import type { AdminProfileActionsSectionProps } from "@rede-enois/design-system/domain";

/**
 * Props do painel administrativo do perfil.
 *
 * "Excluir conta" é a única opção que pode faltar no design system instalado: aqui o contrato do
 * app inclui o callback como opcional, então o painel compila com o DS que já o oferece e com o
 * que ainda não oferece (o botão só aparece quando o DS o desenha). A permissão continua sendo
 * decidida pela API.
 */
export type AdminProfilePanelProps = Omit<AdminProfileActionsSectionProps, "onDeleteAccount"> & {
  /** Offered only by a design system that draws the account removal. */
  onDeleteAccount?: (reason: string) => Promise<boolean>;
};
