import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import { PostNotes as PostNotesView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { postNotesApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { dataHora } from "@/lib/date/format";

/**
 * Rodapé do post: notas aprovadas pela moderação aparecem como verificação da comunidade. Quem
 * ainda não enviou pode pedir uma correção; a nota vai para análise e só aparece depois de aprovada.
 * Nota negada reduz a credibilidade de quem enviou; aprovada (ou em análise) não muda nada.
 */
export function PostNotes({ post }: { post: PostView }) {
  const { data: currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const notes = post.communityNotes ?? [];
  const mine = post.myNote;

  const create = useMutation({
    mutationFn: (body: string) => postNotesApi.create(post.id, body),
  });

  return (
    <PostNotesView
      notes={notes.map((note) => ({
        ...note,
        authorName: note.authorName ?? "",
        createdAtLabel: dataHora(note.createdAt),
        authorHref: note.authorUsername ? `/perfil/${note.authorUsername}` : null,
      }))}
      pending={mine?.status === "PENDING" || sent}
      deniedReason={mine?.status === "DENIED" ? (mine.reviewReason ?? "") : null}
      discarded={mine?.status === "DISCARDED"}
      canAdd={
        Boolean(currentUser) &&
        currentUser?.id !== post.authorId &&
        notes.length === 0 &&
        !mine &&
        !sent
      }
      sending={create.isPending}
      onSend={(body) =>
        create.mutateAsync(body).then(
          () => {
            setSent(true);
            toast(texts.posts.notes.sent, "success");
            return true;
          },
          () => {
            toast(texts.posts.notes.error, "error");
            return false;
          },
        )
      }
    />
  );
}
