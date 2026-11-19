import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { GitHubRepo } from "@/types/application/github-profile/github-repo";
import { Button, Dialog, DialogContent, Pill, useToast } from "@rede-enois/design-system/ui";
import { Loader2 } from "lucide-react";

import { ApiError, githubProfileApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";
import { companyQueries } from "@/lib/query-options/companies";
import { githubOrgQueries } from "@/lib/query-options/github-orgs";

/**
 * Organizações do GitHub como empresa da comunidade: cada uma que a pessoa administra (ou é
 * membro) vira — ou reaproveita — uma empresa, e os repos marcados entram como projetos dela.
 * É um diálogo à parte, aberto pela mesma ação de importar: o GithubImportDialog do design system
 * só conhece repositórios e README, e quem não tem organização não vê nada. O aviso de sucesso
 * leva direto à página da empresa.
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
  const rows = repos.data ?? [];

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto">
        <section className="pb-4">
          <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>

          <p className="mt-1 text-sm text-muted-foreground">{copy.hint}</p>

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={copy.choose}>
            {orgs.data.map((org) => (
              <Button
                key={org.login}
                type="button"
                variant={org.login === selected ? "default" : "outline"}
                size="sm"
                aria-pressed={org.login === selected}
                onClick={() => {
                  setSelectedOrg(org.login);
                  setSelection([]);
                }}
              >
                {org.name ?? org.login}
              </Button>
            ))}
          </div>
          {selected ? (
            <div className="mt-4">
              <a
                className="text-sm text-primary underline-offset-4 hover:underline"
                href={orgs.data.find((org) => org.login === selected)?.htmlUrl}
                target="_blank"
                rel="noreferrer"
              >
                {copy.openOnGithub(selected)}
              </a>
              {repos.isLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {copy.loading}
                </div>
              ) : repos.isError ? (
                <p className="mt-3 text-sm text-destructive">{copy.error}</p>
              ) : rows.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{copy.empty}</p>
              ) : (
                <>
                  <ul className="mt-3 space-y-2">
                    {rows.map((repo) => (
                      <OrgRepoRow
                        key={repo.fullName}
                        repo={repo}
                        checked={selection.includes(repo.fullName)}
                        onToggle={() =>
                          setSelection((current) =>
                            current.includes(repo.fullName)
                              ? current.filter((item) => item !== repo.fullName)
                              : [...current, repo.fullName],
                          )
                        }
                      />
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelection(rows.map((repo) => repo.fullName))}
                    >
                      {copy.selectAll}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={selection.length === 0}
                      onClick={() => setSelection([])}
                    >
                      {copy.clear}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      disabled={selection.length === 0 || importOrg.isPending}
                      onClick={() => importOrg.mutate(selected)}
                    >
                      {importOrg.isPending ? copy.importing : copy.import(selection.length)}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </section>
      </DialogContent>
    </Dialog>
  );
}

/** Abre a empresa importada: a rota resolve pelo slug devolvido pelo servidor. */
async function openCompanyPage(slug: string) {
  if (typeof window === "undefined") return;
  window.location.assign(`/empresa/${encodeURIComponent(slug)}`);
}

function OrgRepoRow({
  repo,
  checked,
  onToggle,
}: {
  repo: GitHubRepo;
  checked: boolean;
  onToggle: () => void;
}) {
  const copy = texts.profile.githubImport.orgs;
  return (
    <li>
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
          checked ? "border-primary" : "border-border"
        }`}
      >
        <input
          type="checkbox"
          className="mt-1"
          checked={checked}
          onChange={onToggle}
          aria-label={repo.fullName}
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{repo.name}</span>
            {repo.fork ? <Pill>{copy.fork}</Pill> : null}
            {repo.archived ? <Pill>{copy.archived}</Pill> : null}
          </span>
          {repo.description ? (
            <span className="mt-1 block text-sm text-muted-foreground">{repo.description}</span>
          ) : null}
          <span className="mt-1 block text-xs text-muted-foreground">
            {[
              repo.language,
              copy.stars(repo.stars),
              copy.forks(repo.forks),
              repo.updatedAt ? copy.updated(dataCurta(repo.updatedAt)) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </label>
    </li>
  );
}
