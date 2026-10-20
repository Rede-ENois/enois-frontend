import type { ThemeGalleryItem } from "@/types/application/themes/theme-gallery-item";

import { api } from "../api-client";

export const themesApi = {
  list: (limit = 60) =>
    api.get<ThemeGalleryItem[]>(`/temas/galeria${limit ? `?limit=${limit}` : ""}`),
  get: (themeId: string) =>
    api.get<{ id: string; name: string; packageJson: string; modeDefault: string }>(
      `/temas/galeria/${themeId}`,
    ),
  publish: (data: {
    name: string;
    description?: string;
    packageJson: string;
    modeDefault: string;
  }) => api.post<{ id: string; status: string }>("/temas/galeria", data),
  install: (themeId: string) => api.post<{ status: string }>(`/temas/galeria/${themeId}/install`),
  report: (themeId: string) => api.post<{ status: string }>(`/temas/galeria/${themeId}/report`),
  hide: (themeId: string) => api.post<{ status: string }>(`/temas/galeria/${themeId}/hide`),
};
