import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { GithubImportDialogProps } from "@/types/components/profile/github-import-dialog-props";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  GithubIcon,
  useToast,
} from "@rede-enois/design-system/ui";
import { Archive, Download, GitFork, Loader2, Star } from "lucide-react";

import { ApiError, githubProfileApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";

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

  const toggle = (fullName: string) =>
    setSelected((current) =>
      current.includes(fullName)
        ? current.filter((item) => item !== fullName)
        : [...current, fullName],
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GithubIcon className="h-5 w-5" />
            {texts.profile.githubImport.title}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs font-normal leading-relaxed text-text-subtle">
          {texts.profile.githubImport.description}
        </p>

        {notLinked ? (
          <p className="rounded-xl border border-border-soft bg-surface-1 px-4 py-3 text-sm text-text-subtle">
            {texts.profile.githubImport.notLinked}{" "}
            <Link to="/seguranca" className="font-medium text-primary hover:underline">
              {texts.profile.githubImport.goToSecurity}
            </Link>
          </p>
        ) : (
          <>
            <section className="space-y-3 border-t border-border-soft pt-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-strong">
                  {texts.profile.githubImport.reposTitle}
                </h3>

                <p className="text-xs text-text-subtle">{texts.profile.githubImport.reposHint}</p>
              </div>

              {repos.isLoading ? (
                <p className="flex items-center gap-2 text-sm text-text-subtle">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {texts.profile.githubImport.loading}
                </p>
              ) : repos.isError ? (
                <p className="text-sm text-destructive">{texts.profile.githubImport.error}</p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-text-subtle">{texts.profile.githubImport.empty}</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setSelected(rows.map((repo) => repo.fullName))}
                    >
                      {texts.profile.githubImport.selectAll}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => setSelected([])}
                    >
                      {texts.profile.githubImport.clear}
                    </Button>
                  </div>

                  <ul className="space-y-2">
                    {rows.map((repo) => {
                      const checked = selected.includes(repo.fullName);

                      return (
                        <li key={repo.fullName}>
                          <label
                            className={
                              checked
                                ? "flex cursor-pointer items-start gap-3 rounded-xl border border-primary bg-primary-soft/40 p-3"
                                : "flex cursor-pointer items-start gap-3 rounded-xl border border-border-soft p-3 hover:border-primary/50"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(repo.fullName)}
                              className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-primary"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-text-strong">{repo.name}</p>

                                {repo.fork && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-subtle">
                                    <GitFork className="h-3 w-3" aria-hidden />
                                    {texts.profile.githubImport.fork}
                                  </span>
                                )}

                                {repo.archived && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-subtle">
                                    <Archive className="h-3 w-3" aria-hidden />
                                    {texts.profile.githubImport.archived}
                                  </span>
                                )}
                              </div>

                              {repo.description && (
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                  {repo.description}
                                </p>
                              )}

                              <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-subtle">
                                {repo.language && <span>{repo.language}</span>}

                                <span className="inline-flex items-center gap-1">
                                  <Star className="h-3 w-3" aria-hidden />
                                  {repo.stars}
                                </span>

                                <span className="inline-flex items-center gap-1">
                                  <GitFork className="h-3 w-3" aria-hidden />
                                  {repo.forks}
                                </span>

                                {repo.updatedAt && <span>{dataCurta(repo.updatedAt)}</span>}

                                <a
                                  href={repo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {texts.profile.githubImport.open}
                                </a>
                              </p>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>

                  <Button
                    className="rounded-full gap-1.5"
                    disabled={selected.length === 0 || importProjects.isPending}
                    onClick={() => importProjects.mutate()}
                  >
                    {importProjects.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {texts.profile.githubImport.importing}
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        {texts.profile.githubImport.import(selected.length)}
                      </>
                    )}
                  </Button>
                </>
              )}
            </section>

            <section className="space-y-3 border-t border-border-soft pt-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-strong">
                  {texts.profile.githubImport.readmeTitle}
                </h3>

                <p className="text-xs text-text-subtle">{texts.profile.githubImport.readmeHint}</p>
              </div>

              {readme.isLoading ? (
                <p className="flex items-center gap-2 text-sm text-text-subtle">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {texts.profile.githubImport.loading}
                </p>
              ) : readmeMissing ? (
                <p className="text-sm text-text-subtle">
                  {texts.profile.githubImport.readmeMissing}
                </p>
              ) : readme.data ? (
                <>
                  <SandboxedHtmlFrame
                    html={readme.data.html}
                    title={texts.profile.githubImport.readmeTitle}
                    className="w-full rounded-xl border border-border-soft"
                    maxHeight={420}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      className="rounded-full gap-1.5"
                      disabled={importReadme.isPending}
                      onClick={() => importReadme.mutate()}
                    >
                      {importReadme.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {texts.profile.githubImport.readmeUsing}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          {texts.profile.githubImport.readmeUse}
                        </>
                      )}
                    </Button>

                    <a
                      href={readme.data.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {texts.profile.githubImport.openReadme}
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm text-destructive">{texts.profile.githubImport.readmeError}</p>
              )}
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
