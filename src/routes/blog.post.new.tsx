import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";

import { BlogPostEditor } from "@/components/blog/blog-post-editor";

export const Route = createFileRoute("/blog/post/new")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.blog.newPost }] }),
  component: () => <BlogPostEditor />,
});
