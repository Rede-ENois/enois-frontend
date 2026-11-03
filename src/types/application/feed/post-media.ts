/** A post attachment as the API sends it with the post, with its pixel size when known. */
export type PostMedia = {
  id: string;
  cdnUrl: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
};
