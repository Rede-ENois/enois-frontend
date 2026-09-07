import { useEffect, useState } from "react";

import type { CommentView } from "@/types/application/comment/comment-view";

import { listComments } from "@/lib/api/comments";

export function usePostCommentsLoader(
  postId: string,
  visible: boolean,
  replaceComments: (comments: CommentView[]) => void,
) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!visible) {
      setLoaded(false);
      return;
    }

    let cancelled = false;
    setLoaded(false);
    listComments(postId)
      .then((data) => {
        if (!cancelled) replaceComments(data.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, replaceComments, visible]);

  return loaded;
}
