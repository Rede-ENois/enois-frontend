import type { PostMediaVideoProps } from "@/types/components/post/post-media-video-props";

export function PostMediaVideo({ videoUrl }: PostMediaVideoProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-soft">
      <video src={videoUrl} controls className="max-h-96 w-full bg-surface-1" />
    </div>
  );
}
