import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ContinueWriting } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { dataHora } from "@/lib/date/format";

import { feedApi } from "@/lib/api/feed";
import { requireAuth } from "@/lib/require-auth";

import { BlogPostEditor } from "@/components/blog/blog-post-editor";

export const Route = createFileRoute("/blog/post/new")({
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    rascunho: typeof search.rascunho === "string" ? search.rascunho : undefined,
  }),
  head: () => ({ meta: [{ title: texts.blog.newPost }] }),
  component: NewPostPage,
});

function NewPostPage() {
  const { rascunho } = Route.useSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const drafts = useQuery({
    queryKey: ["feed", "drafts"],
    queryFn: () => feedApi.drafts(),
    staleTime: 60_000,
  });
  const discard = useMutation({
    mutationFn: (draftId: string) => feedApi.discardDraftById(draftId),
    onSuccess: () => {
      toast(texts.blog.editor.draftDiscarded);
      void queryClient.invalidateQueries({ queryKey: ["feed", "drafts"] });
    },
    onError: () => toast(texts.blog.editor.draftDiscardError, "error"),
  });

  return (
    <>
      <ContinueWriting
        drafts={(drafts.data?.drafts ?? [])
          .filter((d) => d.type === "ARTICLE")
          .map((d) => ({
            id: d.id,
            title: d.content?.trim() || "",
            updatedAtLabel: d.updatedAt ? dataHora(d.updatedAt) : "",
          }))}
        resumeHref={(draftId) =>
          rascunho === draftId ? "/blog/post/new" : `/blog/post/new?rascunho=${draftId}`
        }
        onDiscard={(draftId) => discard.mutate(draftId)}
        discardPending={discard.isPending}
      />
      <BlogPostEditor continueDraftId={rascunho} />
    </>
  );
}
