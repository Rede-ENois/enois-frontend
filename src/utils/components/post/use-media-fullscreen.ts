import { type MouseEvent, useState } from "react";

export function useMediaFullscreen() {
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);

  return {
    fullscreenUrl,
    openFullscreen: (url: string) => setFullscreenUrl(url),
    closeFullscreen: () => setFullscreenUrl(null),
    keepFullscreenOpen: (event: MouseEvent<HTMLImageElement>) => event.stopPropagation(),
  };
}
