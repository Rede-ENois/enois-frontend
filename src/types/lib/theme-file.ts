import type { BackgroundStyle, ThemeSettings } from "@rede-enois/design-system/domain";

/**
 * O arquivo de tema do Énóis (`.enois-theme`).
 *
 * É o que a pessoa baixa, guarda e manda para outra — e é o que o marketplace vai vender. Formato
 * de propósito pequeno e legível: a coleção é uma REFERÊNCIA (o app já tem o catálogo de temas) e
 * só a camada de cores livres viaja como dado. Assim o arquivo tem alguns parágrafos, não um
 * retrato do app inteiro — e um tema feito à mão continua abrindo em versão futura.
 */
export type ThemeFile = {
  /** Formato do arquivo. Sem isto, um JSON qualquer seria aceito como tema. */
  format: "enois-theme";
  version: number;
  /** Nome que a pessoa deu ao tema (opcional: o arquivo funciona sem ele). */
  name?: string;
  /** Coleção de base (ver THEME_COLLECTIONS no design system). `null` = só as cores livres. */
  collection: string | null;
  settings: ThemeSettings;
  /** Cor de widget livre do tema. Ausente = automática (a do tema ou da marca). */
  widget?: BackgroundStyle;
  /** Plano de fundo livre do tema. Ausente = o do tema ou da marca. */
  page?: BackgroundStyle;
};
