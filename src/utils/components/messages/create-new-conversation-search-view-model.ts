import type { NetworkUser } from "@/types/application/network/network-user";

export function createNewConversationSearchViewModel(
  searchQuery: string,
  users: NetworkUser[],
  selectUser: (userId: string) => void,
) {
  const showResults = Boolean(searchQuery);

  return {
    showResults,
    showEmptyState: showResults && users.length === 0,
    users: users.map((user) => ({
      ...user,
      select: () => selectUser(user.id),
    })),
  };
}
