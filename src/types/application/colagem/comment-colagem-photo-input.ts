/** Corpo de contribuição: texto e/ou foto; numa resposta, o comentário pai. */
export type CommentColagemPhotoInput = {
  parentCommentId?: string;
  content?: string;
  mediaId?: string;
  mediaSpoiler?: boolean;
};
