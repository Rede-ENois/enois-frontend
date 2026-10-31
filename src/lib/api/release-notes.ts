import type { ReleaseNote } from "@/types/application/release-notes/release-note";
import type { ReleaseNotePublishInput } from "@/types/application/release-notes/release-note-publish-input";

import { api } from "../api-client";

/**
 * The "O que há de novo" release an admin publishes from the panel. Reading is public (204 when
 * nothing is on air); writing is an admin route, guarded in the backend.
 */
export const releaseNotesApi = {
  current: async () => (await api.get<ReleaseNote | null | undefined>("/novidades/atual")) ?? null,

  publish: (data: ReleaseNotePublishInput) => api.put<ReleaseNote>("/admin/novidades", data),

  retire: () => api.delete<null>("/admin/novidades"),
};
