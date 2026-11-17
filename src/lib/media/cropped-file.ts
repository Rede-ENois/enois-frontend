/**
 * O recorte da foto de perfil é um arquivo como outro: o tipo do blob manda.
 *
 * O recorte sai em PNG quando a imagem tem transparência (o recorte preserva o canal alfa) e em
 * JPEG quando é foto opaca. Forçar "crop.jpg" em cima disso quebrava a transparência: o PNG
 * chegava ao servidor rotulado como JPEG, e a foto de perfil aparecia com fundo preto.
 */

const PNG_TYPE = "image/png";

/** Extensão que combina com o tipo do blob. */
function extensionFor(type: string): string {
  return type === PNG_TYPE ? "png" : "jpg";
}

/** Arquivo do recorte, com nome e tipo coerentes com o conteúdo. */
export function croppedFile(blob: Blob): File {
  const type = blob.type || "image/jpeg";
  return new File([blob], `crop.${extensionFor(type)}`, { type });
}
