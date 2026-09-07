import type { NetworkUser } from "@/types/application/network/network-user";

export type NewConversationSearchResult = NetworkUser & {
  select: () => void;
};
