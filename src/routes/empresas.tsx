import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CompanyDirectoryItem } from "@/types/application/companies/company-directory-item";
import {
  CompanyDirectory,
  type CompanyDirectoryEntryView,
  CreateCompanyDialog,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { companiesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { readStoredContext } from "@/lib/interface-context";
import { companyQueries } from "@/lib/query-options/companies";
import { useIsAuthenticated } from "@/lib/use-auth";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/empresas")({
  head: () => ({ meta: [{ title: texts.empresas.seoTitle }] }),
  component: Empresas,
});

/** A page opens the company; a name that only exists in jobs opens the job search for it. */
function toEntry(item: CompanyDirectoryItem): CompanyDirectoryEntryView {
  return {
    key: `${item.kind}:${item.slug ?? item.name}`,
    name: item.name,
    logo: item.logo ? (resolveCdnUrl(item.logo) ?? null) : null,
    sector: item.sector,
    location: item.location,
    href: item.slug ? `/empresa/${item.slug}` : `/vagas?query=${encodeURIComponent(item.name)}`,
    // No page yet (internal or external jobs only): a compact row that opens its jobs.
    external: item.slug === null,
    openJobs: item.openJobs,
    openProjects: item.openProjects,
    followers: item.followers,
  };
}

function Empresas() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Sessão lida depois da montagem: ler o token no render quebrava a hidratação.
  const logged = useIsAuthenticated();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sector, setSector] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Avisa quando a rota trocou o contexto automaticamente (vindo do feed social, por exemplo).
  const previousContext = useRef(readStoredContext());
  useEffect(() => {
    if (previousContext.current === "SOCIAL") {
      toast(texts.feed.companyPrompt.contextSwitch);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // One request per pause in typing, not per key.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const directory = useQuery(companyQueries.directory(debouncedQuery, sector));
  const sectors = useQuery(companyQueries.sectors());
  const mine = useQuery({ ...companyQueries.mine(), enabled: logged });

  const create = useMutation({
    mutationFn: companiesApi.create,
    onSuccess: (created) => {
      setCreateOpen(false);
      toast(texts.empresa.created, "success");
      void queryClient.invalidateQueries({ queryKey: companyQueries.mine().queryKey });
      void queryClient.invalidateQueries({ queryKey: companyQueries.directoryKey });
      void navigate({ to: "/empresa/$slug", params: { slug: created.slug } });
    },
  });

  return (
    <AppContainer>
      <CompanyDirectory
        query={query}
        onQueryChange={setQuery}
        sectors={sectors.data ?? []}
        sector={sector}
        onSectorChange={setSector}
        entries={(directory.data ?? []).map(toEntry)}
        loading={directory.isPending}
        error={directory.isError}
        onRetry={() => void directory.refetch()}
        myPages={
          logged
            ? (mine.data ?? []).map((page) => ({
                slug: page.slug,
                name: page.name,
                logo: page.logo ? (resolveCdnUrl(page.logo) ?? null) : null,
                href: `/empresa/${page.slug}`,
              }))
            : null
        }
        onCreatePage={() => setCreateOpen(true)}
      />
      <CreateCompanyDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) create.reset();
        }}
        pending={create.isPending}
        error={create.isError ? texts.empresa.createError : null}
        sizeOptions={Object.entries(texts.empresa.sizeOptions).map(([value, label]) => ({
          value,
          label,
        }))}
        onSubmit={(values) =>
          create.mutate({
            name: values.name,
            description: values.description ?? undefined,
            sector: values.sector ?? undefined,
            size: values.size ?? undefined,
            location: values.location ?? undefined,
            website: values.website ?? undefined,
          })
        }
      />
    </AppContainer>
  );
}
