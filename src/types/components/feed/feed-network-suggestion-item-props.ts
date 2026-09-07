import type { NetworkUser } from "@/types/application/network/network-user";

export type FeedNetworkSuggestionItemProps = {
  user: NetworkUser;
  connect: () => void;
};
