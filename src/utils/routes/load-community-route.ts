import { notFound } from "@tanstack/react-router";

import { getCommunity } from "@/lib/api/communities/get-community";

export async function loadCommunityRoute(communityId: string) {
  try {
    return await getCommunity(communityId);
  } catch {
    throw notFound();
  }
}
