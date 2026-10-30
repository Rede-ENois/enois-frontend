import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import {
  Button,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from "@rede-enois/design-system/ui";
import { ArrowLeft, Building2, Plus, Search } from "lucide-react";

import { companiesApi, jobsApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { useIsAuthenticated } from "@/lib/use-auth";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/empresas")({
  head: () => ({ meta: [{ title: texts.empresas.seoTitle }] }),
  component: Empresas,
});

function Empresas() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sector: "",
    size: "",
    location: "",
    website: "",
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Sessão lida depois da montagem: ler o token no render quebrava a hidratação.
  const logged = useIsAuthenticated();

  const { data, isLoading } = useQuery({
    queryKey: ["companies", search],
    queryFn: () => jobsApi.companies(search || undefined, 120),
  });

  const { data: mine } = useQuery({
    queryKey: ["my-companies"],
    queryFn: () => companiesApi.mine(),
    enabled: logged,
  });

  const create = useMutation({
    mutationFn: () => companiesApi.create(form),
    onSuccess: (created) => {
      setCreateOpen(false);
      toast(texts.empresa.created, "success");
      void queryClient.invalidateQueries({ queryKey: ["my-companies"] });
      navigate({ to: "/empresa/$slug", params: { slug: created.slug } });
    },
    onError: () => toast(texts.empresa.projectError, "error"),
  });

  const companies = data ?? [];
  const myCompanies = mine ?? [];
  // As abas (pedido da Mel): Énóis (páginas empresariais reais) primeiro; externas à parte.
  const [aba, setAba] = useState<"enois" | "externas">("enois");
  const visiveis = companies.filter((c) =>
    aba === "enois" ? c.origem !== "externa" : c.origem === "externa",
  );

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-4xl space-y-5">
        {/* Mesmo "voltar" da tela de suporte: a página de empresas é alcançada pelo menu e não
            tinha caminho de volta (relato de suporte). */}
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.post.back}</>
        </Link>

        <PageHeader title={texts.empresas.title} description={texts.empresas.subtitle} />

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={texts.empresas.searchPlaceholder}
            className="h-11 w-full rounded-full border border-border-soft bg-surface-card pl-9 pr-4 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["enois", "Empresas do Énóis"],
              ["externas", "Plataformas externas"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                aba === id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
              }`}
              onClick={() => setAba(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {logged && (
          <div className="surface-card space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{texts.empresa.mineTitle}</h2>

              <Button
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {texts.empresa.createTitle}
              </Button>
            </div>

            {myCompanies.length === 0 ? (
              <p className="text-xs text-text-subtle">{texts.empresa.createHint}</p>
            ) : (
              <ul className="space-y-2">
                {myCompanies.map((company) => (
                  <li key={company.id}>
                    <Link
                      to="/empresa/$slug"
                      params={{ slug: company.slug }}
                      className="flex items-center gap-3 rounded-xl border border-border-soft p-3 transition hover:border-primary/40"
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-primary" />

                      <span className="truncate text-sm font-medium">{company.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : companies.length === 0 ? (
          <div className="rounded-2xl border border-border-soft bg-surface-card">
            <EmptyState icon={Building2} title={texts.empresas.empty} />
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visiveis.map((company) => (
              <li key={company.name}>
                <Link
                  to="/vagas"
                  search={{}}
                  className="surface-card flex items-center gap-3 p-4 transition hover:border-primary/40"
                  onClick={() => {
                    // A busca de vagas e estado interno: o nome da empresa viaja no
                    // sessionStorage e a pagina de vagas puxa ao montar.
                    sessionStorage.setItem("empresas:query", company.name);
                  }}
                >
                  {company.logo ? (
                    <img
                      src={resolveCdnUrl(company.logo)}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-xl border border-border-soft object-contain"
                    />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-lg font-bold text-primary">
                      {company.name.charAt(0).toUpperCase()}
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text-strong">
                      {company.name}
                    </span>

                    <span className="block text-xs text-text-subtle">
                      {texts.empresas.jobsCount(company.openJobs)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-soft bg-surface-card p-5">
              <h3 className="text-base font-semibold">{texts.empresa.createTitle}</h3>

              <p className="mt-1 text-xs text-text-subtle">{texts.empresa.createHint}</p>

              <div className="mt-3 space-y-3 text-sm">
                <input
                  aria-label={texts.empresa.name}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder={texts.empresa.name}
                  className="h-10 w-full rounded-lg border border-border-soft bg-surface-1 px-3 outline-none"
                />
                <textarea
                  aria-label={texts.empresa.description}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder={texts.empresa.description}
                  rows={3}
                  className="w-full rounded-lg border border-border-soft bg-surface-1 p-3 outline-none"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    aria-label={texts.empresa.sector}
                    value={form.sector}
                    onChange={(event) => setForm({ ...form, sector: event.target.value })}
                    placeholder={texts.empresa.sector}
                    className="h-10 w-full rounded-lg border border-border-soft bg-surface-1 px-3 outline-none"
                  />

                  <select
                    value={form.size}
                    onChange={(event) => setForm({ ...form, size: event.target.value })}
                    className="h-10 w-full rounded-lg border border-border-soft bg-surface-1 px-3 outline-none"
                  >
                    <option value="">{texts.empresa.size}</option>
                    {Object.entries(texts.empresa.sizeOptions).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    aria-label={texts.empresa.location}
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    placeholder={texts.empresa.location}
                    className="h-10 w-full rounded-lg border border-border-soft bg-surface-1 px-3 outline-none"
                  />
                  <input
                    aria-label={texts.empresa.website}
                    value={form.website}
                    onChange={(event) => setForm({ ...form, website: event.target.value })}
                    placeholder={texts.empresa.website}
                    className="h-10 w-full rounded-lg border border-border-soft bg-surface-1 px-3 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setCreateOpen(false)}
                >
                  {texts.common.cancel}
                </Button>

                <Button
                  className="rounded-full"
                  disabled={create.isPending || form.name.trim().length < 2}
                  onClick={() => create.mutate()}
                >
                  {texts.empresa.create}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContainer>
  );
}
