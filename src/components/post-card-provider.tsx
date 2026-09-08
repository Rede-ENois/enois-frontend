import type { PostCardProviderProps } from "@/types/components/post/post-card-provider-props";
import { PostCardContext } from "@/utils/components/post/post-card-context";
import { usePostCardController } from "@/utils/components/post/use-post-card-controller";

import { PostCard } from "@/components/post-card";

export function PostCardProvider({ post }: PostCardProviderProps) {
  const controller = usePostCardController(post);

  return (
    <PostCardContext.Provider value={{ post, ...controller }}>
      <PostCard />
    </PostCardContext.Provider>
  );
}
