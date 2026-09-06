import { api, buildQuery } from "../api-client";
import type { PostView } from "./feed";

export interface Community {
  id: string;
  name: string;
  description: string;
  topic: string;
  members: number;
  joined: boolean;
  cover: string | null;
  avatar: string | null;
}

export interface CommunityMember {
  userId: string;
  username: string;
  name: string;
  avatar: string | null;
  role: "ADMIN" | "MEMBER";
}

export interface CreateCommunityInput {
  name: string;
  description: string;
  topic: string;
  cover?: string | null;
  avatar?: string | null;
}

export interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export const communityApi = {
  list: (topic?: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Community>>(`/communities${buildQuery({ topic, cursor, limit })}`),

  getById: (communityId: string) => api.get<Community>(`/communities/${communityId}`),

  create: (input: CreateCommunityInput) => api.post<Community>("/communities", input),

  update: (communityId: string, input: Partial<CreateCommunityInput>) =>
    api.patch<Community>(`/communities/${communityId}`, input),

  join: (communityId: string) =>
    api.post<{ status: string }>(`/communities/${communityId}/members`),

  leave: (communityId: string) =>
    api.delete<{ status: string }>(`/communities/${communityId}/members`),

  listMembers: (communityId: string) =>
    api.get<{ items: CommunityMember[] }>(`/communities/${communityId}/members`),

  listFeed: (communityId: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(
      `/communities/${communityId}/feed${buildQuery({ cursor, limit })}`,
    ),
};
