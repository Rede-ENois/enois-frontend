import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { AdminPostNote } from "@/types/application/feed/admin-post-note";
import { Button, Textarea, useToast } from "@rede-enois/design-system/ui";
import { Loader2, StickyNote } from "lucide-react";

import { postNotesApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

import { ListRowSkeletons } from "@/components/skeletons/list-row-skeletons";

/** Fila de notas de rodapé: aprovar publica no post; negar exige motivo e pesa na credibilidade. */
export function NotesSection() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "notes"],
    queryFn: () => postNotesApi.pending(),
    retry: false,
  });

  const notes = data ?? [];

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          {texts.moderator.notes.title}
        </h2>

        <p className="text-sm text-muted-foreground">{texts.moderator.notes.description}</p>
      </div>

      {isLoading ? (
        <ListRowSkeletons />
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-center text-sm text-text-subtle">
          <StickyNote className="mx-auto mb-2 h-6 w-6 text-primary" />

          <>{texts.moderator.notes.empty}</>
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              onReviewed={() => {
                void queryClient.invalidateQueries({ queryKey: ["moderator", "notes"] });
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function NoteRow({ note, onReviewed }: { note: AdminPostNote; onReviewed: () => void }) {
  const { toast } = useToast();
  const [denying, setDenying] = useState(false);
  const [reason, setReason] = useState("");

  const review = useMutation({
    mutationFn: (data: { status: "APPROVED" | "DENIED"; reason?: string }) =>
      postNotesApi.review(note.id, data),
    onSuccess: (_result, variables) => {
      toast(
        variables.status === "APPROVED"
          ? texts.moderator.notes.approved
          : texts.moderator.notes.denied,
        "success",
      );
      setDenying(false);
      setReason("");
      onReviewed();
    },
    onError: () => toast(texts.moderator.notes.error, "error"),
  });

  return (
    <li className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-subtle">
        <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-text-strong">
          #{note.id.slice(-6)}
        </span>

        <span>{dataHora(note.createdAt)}</span>

        <Link
          to="/post/$postId"
          params={{ postId: note.postId }}
          className="text-primary hover:underline"
        >
          {texts.moderator.notes.openPost}
        </Link>
      </div>

      <p className="break-words text-xs text-text-subtle">
        {note.authorUsername ? `@${note.authorUsername}` : (note.authorName ?? note.authorId)}
      </p>

      <p className="whitespace-pre-wrap break-words rounded-xl bg-surface-2 px-3 py-2 text-sm text-text-strong">
        {note.body}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="rounded-full"
          disabled={review.isPending}
          onClick={() => review.mutate({ status: "APPROVED" })}
        >
          {review.isPending && review.variables?.status === "APPROVED" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}

          <>{texts.moderator.notes.approve}</>
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={review.isPending}
          onClick={() => setDenying((value) => !value)}
        >
          <>{denying ? texts.moderator.notes.cancel : texts.moderator.notes.reject}</>
        </Button>
      </div>

      {denying && (
        <div className="space-y-2 rounded-xl border border-border-soft bg-surface-1 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
            {texts.moderator.notes.reasonLabel}
          </p>

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder={texts.moderator.notes.reasonPlaceholder}
          />

          <Button
            size="sm"
            variant="destructive"
            className="rounded-full"
            disabled={review.isPending || reason.trim().length < 5}
            onClick={() => review.mutate({ status: "DENIED", reason: reason.trim() })}
          >
            {review.isPending && review.variables?.status === "DENIED" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}

            <>{texts.moderator.notes.confirmReject}</>
          </Button>
        </div>
      )}
    </li>
  );
}
