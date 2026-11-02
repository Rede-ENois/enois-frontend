import type { ReactNode } from "react";

import type { NetworkUser } from "@/types/application/network/network-user";

export type PersonCardProps = {
  user: NetworkUser;
  /** One quiet line under the headline (e.g. connections in common); omitted when there is none. */
  note?: string | null;
  /** The card action. */
  children: ReactNode;
};
