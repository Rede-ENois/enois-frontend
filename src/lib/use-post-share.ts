import { share } from "@/lib/api/reactions/share";
import { usePostCardStore } from "@/stores/post-card.store";

export function usePostShare(postId: string) {
  const setPostCounters = usePostCardStore((state) => state.setPostCounters);

  const sharePost = async () => {
    try {
      const result = await share(postId);
      setPostCounters(postId, result.counters);
      const url = `${window.location.origin}/feed/${postId}`;
      if (navigator.share) await navigator.share({ url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // silently fail
    }
  };

  return sharePost;
}
