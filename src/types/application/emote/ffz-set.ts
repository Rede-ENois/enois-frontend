import type { FfzEmote } from "./ffz-emote";

/** Um set de figurinhas do FrankerFaceZ. */
export type FfzSet = {
  id: number;
  title?: string;
  emoticons?: FfzEmote[];
};
