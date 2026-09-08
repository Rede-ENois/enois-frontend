import type { MouseEventHandler } from "react";

export type PostMediaFullscreenProps = {
  fullscreenUrl: string;
  closeFullscreen: () => void;
  keepFullscreenOpen: MouseEventHandler<HTMLImageElement>;
};
