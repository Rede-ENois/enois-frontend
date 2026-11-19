import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { AdminPostRemovalView } from "@/types/application/moderation/admin-post-removal-view";
import { AdminRemovePostAction } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, moderationApi } from "@/lib/api";
import { removePostFromFeedCache } from "@/lib/feed/post-query-cache";

/**
 * Botão de exclusão administrativa dentro do card do post — só montado para admin da plataforma.
 *
 * A remoção é a direta (`POST /admin/moderation/posts/{id}/remove`): motivo obrigatório, sem
 * denúncia e sem votação. O backend responde o que de fato aconteceu (`REMOVED`,
 * `ALREADY_OFFLINE`, `NOT_FOUND`) e a tela repete isso — nunca "deu certo" por si. O card some da
 * lista sem recarregar a página: o feed é invalidado assim que a remoção volta.
 */
export function AdminPostRemoveButton({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const copy = texts.platformAdmin.post;

  const remove = async (reason: string) => {
    setError(null);
    setPending(true);
    try {
      const result = await moderationApi.adminRemovePost(postId, reason);
      const status = (result as AdminPostRemovalView).status;
      if (status === "REMOVED") {
        toast(copy.removed, "success");
        removePostFromFeedCache(queryClient, postId);
        void queryClient.invalidateQueries({ queryKey: ["post", postId] });
      } else if (status === "ALREADY_OFFLINE") {
        toast(copy.alreadyOffline);
      } else {
        setError(copy.notFound);
        return false;
      }
      return true;
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : copy.error);
      return false;
    } finally {
      setPending(false);
    }
  };

  return (
    <AdminRemovePostAction
      label={copy.remove}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirm}
      cancelLabel={texts.common.cancel}
      reasonPlaceholder={copy.placeholder}
      reasonTooShort={copy.tooShort}
      pending={pending}
      error={error}
      onRemove={remove}
    />
  );
}
