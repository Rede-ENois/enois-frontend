import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { ReleaseNotesEditor, type WhatsNewItem } from "@rede-enois/design-system/domain";
import { Button, EmptyState, useToast } from "@rede-enois/design-system/ui";
import { CloudOff } from "lucide-react";

import { ApiError, releaseNotesApi } from "@/lib/api";

const QUERY_KEY = ["novidades", "atual"];

const draftItem = (): WhatsNewItem => ({ id: crypto.randomUUID(), title: "", description: "" });

/**
 * Admin panel for the "O que há de novo" release: structured items, published without a deploy.
 * Like the platform notice, a publication replaces the one on air, so the form starts with what is
 * live (or one empty item) and is seeded only once, never overwriting what the admin is editing.
 */
export function ReleaseNotesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: release,
    isSuccess,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => releaseNotesApi.current(),
    retry: false,
  });

  const [items, setItems] = useState<WhatsNewItem[]>([]);
  const seeded = useRef(false);

  useEffect(() => {
    // Only a successful read seeds the form: after a failed one, an empty form would read as
    // "nothing on air" and the admin could publish over a release they never saw.
    if (seeded.current || !isSuccess) return;
    seeded.current = true;
    setItems(
      release?.items.length
        ? release.items.map((item) => ({ id: crypto.randomUUID(), ...item }))
        : [draftItem()],
    );
  }, [isSuccess, release]);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const publish = useMutation({
    mutationFn: () =>
      releaseNotesApi.publish({
        items: items.map(({ title, description }) => ({
          title: title.trim(),
          description: description.trim(),
        })),
      }),
    onSuccess: () => {
      toast(texts.moderator.releaseNotes.published, "success");
      refresh();
    },
    onError: (error) =>
      toast(
        error instanceof ApiError ? error.message : texts.moderator.releaseNotes.error,
        "error",
      ),
  });

  const retire = useMutation({
    mutationFn: () => releaseNotesApi.retire(),
    onSuccess: () => {
      toast(texts.moderator.releaseNotes.retired, "success");
      refresh();
    },
    onError: () => toast(texts.moderator.releaseNotes.error, "error"),
  });

  if (isError) {
    return (
      <EmptyState
        icon={CloudOff}
        title={texts.moderator.releaseNotes.readErrorTitle}
        description={texts.moderator.releaseNotes.readErrorDescription}
      >
        <Button
          variant="outline"
          className="rounded-full sm:w-auto"
          disabled={isRefetching}
          onClick={() => void refetch()}
        >
          {texts.moderator.releaseNotes.retryRead}
        </Button>
      </EmptyState>
    );
  }

  return (
    <ReleaseNotesEditor
      items={items}
      onItemsChange={setItems}
      liveSince={release ? texts.moderator.releaseNotes.liveSince(release.updatedAt) : null}
      publishing={publish.isPending}
      retiring={retire.isPending}
      onPublish={() => publish.mutate()}
      onRetire={() => retire.mutate()}
    />
  );
}
