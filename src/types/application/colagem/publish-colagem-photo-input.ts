/** Corpo de publicação na Colagem: a foto (mediaId) é obrigatória; legenda e véu são opcionais. */
export type PublishColagemPhotoInput = {
  mediaId: string;
  description?: string;
  mediaSpoiler?: boolean;
};
