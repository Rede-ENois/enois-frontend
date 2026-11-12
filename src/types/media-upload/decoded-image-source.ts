/** Fonte decodificável da imagem: bitmap do navegador ou elemento `<img>`. */
type DecodedImageSource = {
  width: number;
  height: number;
  close?(): void;
};

export type { DecodedImageSource };
