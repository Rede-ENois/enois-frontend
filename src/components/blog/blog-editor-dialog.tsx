import { useEffect, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { BlogEditorDialogProps } from "@/types/components/blog/blog-editor-dialog-props";
import {
  BlogEditorDialog as BlogEditorDialogView,
  type BlogEditorValues,
} from "@rede-enois/design-system/domain";

import { blogsApi } from "@/lib/api/blogs";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * Criar/editar o blog: nome, descrição e o tema em HTML/CSS.
 *
 * O tema é o mesmo editor (e o mesmo quadro isolado) das páginas do perfil — HTML e CSS livres,
 * sanitizados no backend. Vazio = cabeçalho padrão do blog.
 */
export function BlogEditorDialog({ open, onOpenChange, blog }: BlogEditorDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Abriu o diálogo: o erro da tentativa anterior some.
  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const save = useMutation({
    mutationFn: (values: BlogEditorValues) => blogsApi.save(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      onOpenChange(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : texts.blog.editor.error),
  });

  return (
    <BlogEditorDialogView
      open={open}
      onOpenChange={onOpenChange}
      blog={blog}
      pending={save.isPending}
      error={error}
      onSave={(values) => save.mutate(values)}
      renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
    />
  );
}
