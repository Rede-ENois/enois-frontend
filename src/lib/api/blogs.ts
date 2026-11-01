import type { StatusResponse } from "@/types/application/api/status-response";
import type { Blog } from "@/types/application/blog/blog";
import type { BlogPost } from "@/types/application/blog/blog-post";
import type { BlogPostFormat } from "@/types/application/blog/blog-post-format";
import type { BlogSummary } from "@/types/application/blog/blog-summary";

import { api, buildQuery } from "../api-client";

/**
 * Blogs: o cantinho de cada pessoa. A leitura é pública (`/blogs/{slug}` é o link que a pessoa
 * compartilha); o resto é do dono. Inscrever-se é o que faz as novidades aparecerem no "Para você".
 */
export const blogsApi = {
  directory: (limit = 50, query?: string) =>
    api.get<BlogSummary[]>(`/blogs${buildQuery({ limit, query })}`),

  get: (slug: string) => api.get<Blog>(`/blogs/${encodeURIComponent(slug)}`),

  /** O meu blog, para o editor. `null` = ainda não existe (a tela oferece criar). */
  mine: () => api.get<Blog | null>("/blogs/me"),

  save: (data: { title: string; description?: string | null; themeHtml?: string | null }) =>
    api.put<Blog>("/blogs/me", data),

  publish: (data: {
    title: string;
    body: string;
    format: BlogPostFormat;
    /** false = publica sem avisar assinantes (nem in-app, nem e-mail). */
    notifySubscribers?: boolean;
  }) => api.post<BlogPost>("/blogs/me/posts", data),

  editPost: (postId: string, data: { title: string; body: string; format: BlogPostFormat }) =>
    api.patch<BlogPost>(`/blogs/me/posts/${encodeURIComponent(postId)}`, data),

  removePost: (postId: string) =>
    api.delete<StatusResponse>(`/blogs/me/posts/${encodeURIComponent(postId)}`),

  subscribe: (slug: string) =>
    api.post<StatusResponse>(`/blogs/${encodeURIComponent(slug)}/subscription`),

  unsubscribe: (slug: string) =>
    api.delete<StatusResponse>(`/blogs/${encodeURIComponent(slug)}/subscription`),
};
