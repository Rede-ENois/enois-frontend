import type { ReactNode } from "react";

/** Who the popover shows: by username when the list has it, else by user id. */
export type ProfilePeekProps = {
  username?: string | null;
  userId?: string | null;
  /** Accessible name of the trigger (the person's name). */
  name: string;
  /** The avatar or the name that opens the card. */
  children: ReactNode;
  className?: string;
};
