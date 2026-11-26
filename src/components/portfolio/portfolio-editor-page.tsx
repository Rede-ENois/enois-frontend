import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MyPortfolio } from "@/types/application/portfolio/my-portfolio";
import type { PortfolioBlockInput } from "@/types/application/portfolio/portfolio-block-input";
import type { PortfolioRequest } from "@/types/application/portfolio/portfolio-request";
import type { SavedPortfolio } from "@/types/application/portfolio/saved-portfolio";
import type { PortfolioBlockValues } from "@rede-enois/design-system/domain";
import { PortfolioEditor } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { portfolioApi, projectsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { portfolioErrorText } from "@/lib/portfolio/portfolio-errors";
import { toEditorBlock } from "@/lib/portfolio/portfolio-views";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/** O limite de peças do backend (PortfolioService.MAX_BLOCKS). */
const MAX_BLOCKS = 30;

function blockInputOf(values: PortfolioBlockValues): PortfolioBlockInput {
  return {
    type: values.kind,
    title: values.title || undefined,
    text: values.text || undefined,
    projectId: values.projectId || undefined,
    mediaId: values.mediaId || undefined,
    linkUrl: values.linkUrl || undefined,
  };
}

/**
 * O editor do portfólio do dono.
 *
 * O servidor é a fonte da verdade depois de cada gravação: a resposta (o rascunho inteiro) entra no
 * cache, então a tela nunca mostra um estado que a API não confirmou. A página em HTML/CSS é
 * gravada à parte das peças; publicar congela o rascunho na próxima versão.
 */
export function PortfolioEditorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mine = useQuery({ queryKey: ["my-portfolio"], queryFn: () => portfolioApi.mine() });
  const projects = useQuery({ queryKey: ["my-projects"], queryFn: () => projectsApi.mine() });

  const current = mine.data;
  const usedProjects = new Set(
    (current?.blocks ?? [])
      .filter((block) => block.type === "PROJECT" && block.projectId)
      .map((block) => block.projectId as string),
  );
  const full = (current?.blocks.length ?? 0) >= MAX_BLOCKS;

  const outros = (projects.data ?? []).map((project) => ({
    id: project.id,
    title: project.title,
    state: usedProjects.has(project.id)
      ? ("used" as const)
      : full
        ? ("full" as const)
        : ("available" as const),
  }));

  const save = useMutation({
    mutationFn: (request: PortfolioRequest) => request(),
    onSuccess: (saved, request) => {
      if (saved.kind === "portfolio") {
        queryClient.setQueryData(["my-portfolio"], saved.portfolio);
      } else {
        // Publicar não muda o rascunho: a página e as peças continuam iguais, agora no ar.
        queryClient.setQueryData<MyPortfolio>(["my-portfolio"], (old) =>
          old ? { ...old, publishedVersion: saved.published.version } : old,
        );
      }
      if (request.kind === "draft") setDraft(null);
      setError(null);
      toast(request.success);
    },
    onError: (failure, request) => {
      setError(
        failure instanceof ApiError
          ? portfolioErrorText(failure.code, failure.message)
          : request.failure,
      );
    },
  });

  const run = (
    kind: PortfolioRequest["kind"],
    action: () => Promise<SavedPortfolio>,
    success: string,
    failure: string,
  ) => {
    if (save.isPending) return;
    setError(null);
    save.mutate(Object.assign(action, { kind, success, failure }));
  };

  return (
    <PortfolioEditor
      state={mine.isLoading ? "loading" : mine.isError ? "error" : "ready"}
      html={draft ?? current?.html ?? ""}
      publishedVersion={current?.publishedVersion ?? 0}
      publishedAt={current?.publishedAt ?? null}
      blocks={(current?.blocks ?? []).map(toEditorBlock)}
      outros={outros}
      error={error}
      pending={save.isPending}
      renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
      onDraftChange={setDraft}
      onSaveDraft={() =>
        run(
          "draft",
          async () => ({ kind: "portfolio", portfolio: await portfolioApi.saveDraft(draft ?? "") }),
          texts.portfolio.pageSaved,
          texts.portfolio.savePageError,
        )
      }
      onSaveBlock={(values, blockId) =>
        run(
          "block",
          async () => {
            const input = blockInputOf(values);
            const saved = blockId
              ? await portfolioApi.updateBlock(blockId, input)
              : await portfolioApi.createBlock(input);
            return { kind: "portfolio", portfolio: saved };
          },
          texts.portfolio.blockSaved,
          texts.portfolio.saveBlockError,
        )
      }
      onRemoveBlock={(blockId) =>
        run(
          "remove",
          async () => ({ kind: "portfolio", portfolio: await portfolioApi.removeBlock(blockId) }),
          texts.portfolio.blockRemoved,
          texts.portfolio.removeError,
        )
      }
      onReorder={(order) =>
        run(
          "order",
          async () => ({ kind: "portfolio", portfolio: await portfolioApi.reorder(order) }),
          texts.portfolio.blockSaved,
          texts.portfolio.reorderError,
        )
      }
      onPublish={() =>
        run(
          "publish",
          async () => ({ kind: "published", published: await portfolioApi.publish() }),
          texts.portfolio.published,
          texts.portfolio.publishError,
        )
      }
    />
  );
}
