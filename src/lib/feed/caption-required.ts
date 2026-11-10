import type { PostView } from "@/types/application/feed/post-view";

/**
 * The backend refuses a post without text (except PAGE), so "Publicar" stays disabled while the
 * field is empty. With media attached that looks like a broken button: the person came from the
 * "Foto"/"Vídeo" shortcut, sees the picture and nothing says the text is missing. This tells the
 * composer when to say so. Article and poll are left out: there the field is the title or the
 * question, and their placeholders already explain it.
 */
export function captionRequired({
  postType,
  mediaCount,
  draft,
}: {
  postType: PostView["type"];
  mediaCount: number;
  draft: string;
}): boolean {
  if (postType === "PAGE" || postType === "ARTICLE" || postType === "POLL") return false;
  return mediaCount > 0 && draft.trim() === "";
}
