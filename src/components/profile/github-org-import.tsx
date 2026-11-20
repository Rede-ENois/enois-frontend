import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { GithubOrgImportDialog, type GithubRepoRow } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, githubProfileApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";
import { companyQueries } from "@/lib/query-options/companies";
import { githubOrgQueries } from "@/lib/query-options/github-orgs";

/**
 * Organizações do GitHub como empresa da comunidade: cada uma que a pessoa administra (ou é
 * membro) vira — ou reaproveita — uma empresa, e os repos marcados entram como projetos dela.
 * É um diálogo à parte, aberto pela mesma ação de importar: o GithubImportDialog do design system
 * só conhece repositórios e README, e quem não tem organização não vê nada. O aviso de sucesso
 * leva direto à página da empresa. O desenho é do DS (`GithubOrgImportDialog`).
 */
export function GithubOrgImport({
  open,
  onOpenChange,
  username,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgs = useQuery({ ...githubOrgQueries.list(), enabled: open, retry: false });
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const selected = selectedOrg ?? orgs.data?.[0]?.login ?? null;
  const repos = useQuery({
    ...githubOrgQueries.repos(selected ?? ""),
    enabled: open && !!selected,
    retry: false,
  });
  const rows: GithubRepoRow[] = (repos.data ?? []).map((repo) => ({
    name: repo.name,
    fullName: repo.fullName,
    description: repo.description,
    language: repo.language,
    stars: repo.stars,
    forks: repo.forks,
    fork: repo.fork,
    archived: repo.archived,
    updatedAtLabel: repo.updatedAt ? dataCurta(repo.updatedAt) : null,
    url: repo.url,
  }));

  const importOrg = useMutation({
    mutationFn: (org: string) => githubProfileApi.importOrg(org, selection),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["projects", username] });
      void queryClient.invalidateQueries({ queryKey: ["profile", username] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: companyQueries.directoryKey });
      void queryClient.invalidateQueries({ queryKey: ["my-companies"] });
      setSelection([]);
      toast(texts.profile.githubImport.orgImported(result.name, result.created), "success", {
        label: texts.profile.githubImport.orgs.open,
        onClick: () => {
          onOpenChange(false);
          void openCompanyPage(result.slug);
        },
      });
    },
    onError: (error) =>
      toast(
        error instanceof ApiError ? error.message : texts.profile.githubImport.orgError,
        "error",
      ),
  });

  if (!open || orgs.data === undefined || orgs.data.length === 0) return null;
  const copy = texts.profile.githubImport.orgs;

  return (
    <GithubOrgImportDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      hint={copy.hint}
      chooseLabel={copy.choose}
      orgs={{ loading: orgs.isLoading, error: orgs.isError, items: orgs.data }}
      selectedOrg={selected}
      onSelectOrg={(login) => {
        setSelectedOrg(login);
        setSelection([]);
      }}
      activeOrg={orgs.data.find((org) => org.login === selected) ?? null}
      repos={{ loading: repos.isLoading, error: repos.isError, rows }}
      selected={selection}
      onToggle={(fullName) =>
        setSelection((current) =>
          current.includes(fullName)
            ? current.filter((item) => item !== fullName)
            : [...current, fullName],
        )
      }
      onSelectAll={() => setSelection(rows.map((repo) => repo.fullName))}
      onClear={() => setSelection([])}
      importing={importOrg.isPending}
      onImport={() => selected && importOrg.mutate(selected)}
    />
  );
}

/** Abre a empresa importada: a rota resolve pelo slug devolvido pelo servidor. */
async function openCompanyPage(slug: string) {
  if (typeof window === "undefined") return;
  window.location.assign(`/empresa/${encodeURIComponent(slug)}`);
}
