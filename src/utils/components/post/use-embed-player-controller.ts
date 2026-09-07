import { useState } from "react";

import type { EmbedPlayerProps } from "@/types/components/post/embed-player-props";

import { createEmbedPlayerViewModel } from "@/utils/components/post/create-embed-player-view-model";

export function useEmbedPlayerController(props: EmbedPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const view = createEmbedPlayerViewModel(
    props,
    typeof window !== "undefined" ? window.location.hostname : "",
  );

  return {
    playing,
    startPlaying: () => setPlaying(true),
    ...view,
  };
}
