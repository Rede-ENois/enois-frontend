import type { Theme } from "@rede-enois/design-system/domain";

/** A personalização atual convertida no pacote que a galeria aceita (e o marketplace vende). */
export type GalleryPackage = {
  /** Modo em que a pessoa está montando o visual. */
  modeDefault: Theme;
  /** JSON pronto para `POST /temas/galeria`. */
  packageJson: string;
};
