import { notFound } from "@tanstack/react-router";

import { getProfile } from "@/lib/api/profile";

export async function loadProfileRoute(username: string) {
  try {
    const user = await getProfile(username);
    return { user };
  } catch {
    throw notFound();
  }
}
