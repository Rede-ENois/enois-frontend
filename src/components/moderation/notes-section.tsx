import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import {
  type NoteReviewStatus,
  NotesSection as NotesSectionView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { postNotesApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

/** Fila de notas de rodapé: aprovar publica no post; negar exige motivo e pesa na credibilidade. */
export function NotesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "notes"],
    queryFn: () => postNotesApi.pending(),
    retry: false,
  });

  const review = useMutation({
    mutationFn: ({
      noteId,
      status,
      reason,
    }: {
      noteId: string;
      status: NoteReviewStatus;
      reason?: string;
    }) => postNotesApi.review(noteId, { status, reason }),
  });

  return (
    <NotesSectionView
      loading={isLoading}
      notes={(data ?? []).map((note) => ({
        ...note,
        postHref: `/post/${note.postId}`,
        createdAtLabel: dataHora(note.createdAt),
      }))}
      reviewing={
        review.isPending && review.variables
          ? { id: review.variables.noteId, status: review.variables.status }
          : null
      }
      onReview={(note, status, reason) =>
        review.mutateAsync({ noteId: note.id, status, reason }).then(
          () => {
            toast(
              status === "APPROVED" ? texts.moderator.notes.approved : texts.moderator.notes.denied,
              "success",
            );
            void queryClient.invalidateQueries({ queryKey: ["moderator", "notes"] });
            return true;
          },
          () => {
            toast(texts.moderator.notes.error, "error");
            return false;
          },
        )
      }
    />
  );
}
