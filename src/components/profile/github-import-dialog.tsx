import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { GithubImportDialogProps } from "@/types/components/profile/github-import-dialog-props";
import { GithubImportDialog as GithubImportDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, githubProfileApi } from "@/lib/api";
import { getCurrentUserId } from "@/lib/current-user";
import { dataCurta } from "@/lib/date/format";
import { profileQueries } from "@/lib/query-options/profiles";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * Importação do GitHub para o perfil: os repositórios públicos viram cards de projeto (com o
 * link apontando para o repositório) e o README do perfil vira a bio em HTML. O handle vem do
 * vínculo verificado; o corpo só escolhe quais repositórios entram.
 */
export function GithubImportDialog({ open, onOpenChange, username }: GithubImportDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);

  const repos = useQuery({
    queryKey: ["github", "repos"],
    queryFn: () => githubProfileApi.repos(),
    enabled: open,
    retry: false,
  });

  const readme = useQuery({
    queryKey: ["github", "readme"],
    queryFn: () => githubProfileApi.readme(),
    enabled: open,
    retry: false,
  });

  const importProjects = useMutation({
    mutationFn: () => githubProfileApi.importProjects(selected),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["projects", username] });
      setSelected([]);
      toast(
        texts.profile.githubImport.imported(
          result.created,
          result.skipped.length,
          result.invalid.length,
        ),
      );
    },
    onError: (error) =>
      toast(error instanceof ApiError ? error.message : texts.profile.githubImport.error, "error"),
  });

  const importReadme = useMutation({
    mutationFn: () => githubProfileApi.importReadme(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", username] });
      const userId = getCurrentUserId();
      if (userId)
        void queryClient.invalidateQueries({ queryKey: profileQueries.byId(userId).queryKey });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      toast(texts.profile.githubImport.readmeSaved);
    },
    onError: (error) =>
      toast(
        error instanceof ApiError ? error.message : texts.profile.githubImport.readmeError,
        "error",
      ),
  });

  const notLinked = repos.error instanceof ApiError && repos.error.code === "GITHUB_NOT_LINKED";
  const readmeMissing =
    readme.error instanceof ApiError && readme.error.code === "GITHUB_README_NOT_FOUND";
  const rows = repos.data ?? [];

  return (
    <GithubImportDialogView
      open={open}
      onOpenChange={onOpenChange}
      notLinked={notLinked}
      securityHref="/seguranca"
      repos={{
        loading: repos.isLoading,
        error: repos.isError,
        rows: rows.map((repo) => ({
          ...repo,
          updatedAtLabel: repo.updatedAt ? dataCurta(repo.updatedAt) : null,
        })),
      }}
      selected={selected}
      onToggle={(fullName) =>
        setSelected((current) =>
          current.includes(fullName)
            ? current.filter((item) => item !== fullName)
            : [...current, fullName],
        )
      }
      onSelectAll={() => setSelected(rows.map((repo) => repo.fullName))}
      onClear={() => setSelected([])}
      importing={importProjects.isPending}
      onImport={() => importProjects.mutate()}
      readme={{
        loading: readme.isLoading,
        missing: readmeMissing,
        data: readme.data ?? null,
        error: readme.isError && !readmeMissing,
      }}
      usingReadme={importReadme.isPending}
      onUseReadme={() => importReadme.mutate()}
      renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
    />
  );
}
