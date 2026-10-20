import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { blogsApi } from "@/lib/api/blogs";
import { requireAuth } from "@/lib/require-auth";

import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

import { AppContainer } from "@/components/app-container";
import { BlogPostEditor } from "@/components/blog/blog-post-editor";

export const Route = createFileRoute("/blog/post/$postId")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.blog.editor.editPost }] }),
  component: EditBlogPost,
});

/** Editar um post do próprio blog, em tela cheia. O post vem do blog de quem está logado. */
function EditBlogPost() {
  const { postId } = Route.useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog", "me", "post", postId],
    queryFn: async () => {
      const mine = await blogsApi.mine();
      if (!mine) return null;
      const blog = await blogsApi.get(mine.slug);
      return blog.items.find((item) => item.id === postId) ?? null;
    },
  });

  if (isLoading) {
    return (
      <AppContainer>
        <LoadingState />
      </AppContainer>
    );
  }

  if (!post) {
    return (
      <AppContainer>
        <EmptyState title={texts.blog.editor.editPost} description={texts.blog.seoFallbackTitle} />
      </AppContainer>
    );
  }

  return <BlogPostEditor post={post} />;
}
