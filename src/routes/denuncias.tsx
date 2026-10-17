import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft, Flag } from "lucide-react";

import { reportsApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/denuncias")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: buildPageShareTags({ title: texts.myReports.seoTitle, path: "/denuncias" }),
  }),
  component: MinhasDenuncias,
});

function StatusBadge({ status }: { status: string }) {
  const label = texts.myReports.status[status] ?? status.toLowerCase();
  const tone =
    status === "APPROVED"
      ? "bg-green-500/15 text-green-700 dark:text-green-400"
      : status === "DISMISSED"
        ? "bg-muted text-text-subtle"
        : "bg-amber-500/15 text-amber-700 dark:text-amber-400";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{label}</span>
  );
}

function MinhasDenuncias() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-reports"],
    queryFn: () => reportsApi.mine(),
  });

  const reports = data ?? [];

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.myReports.back}</>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{texts.myReports.title}</h1>

          <p className="text-sm text-muted-foreground">{texts.myReports.description}</p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-border-soft bg-surface-card">
            <EmptyState icon={Flag} title={texts.myReports.empty} />
            <p className="pb-6 text-center text-sm text-text-subtle">{texts.myReports.emptyHint}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
            {reports.map((report) => (
              <li key={report.id} className="space-y-1.5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={report.status} />

                  <span className="text-sm font-medium text-text-strong">
                    {texts.myReports.reason[report.reason] ?? report.reason}
                  </span>

                  <span className="text-xs text-text-subtle">
                    {texts.myReports.target[report.targetType] ?? report.targetType}
                  </span>

                  <span className="ml-auto text-xs text-text-subtle">
                    {new Date(report.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {report.description && (
                  <p className="text-sm text-text-subtle">{report.description}</p>
                )}

                {report.targetType === "POST" && (
                  <Link
                    to="/post/$postId"
                    params={{ postId: report.targetId }}
                    className="inline-block text-xs text-primary hover:underline"
                  >
                    {texts.myReports.viewPost}
                  </Link>
                )}

                {report.targetType === "JOB" && (
                  <Link
                    to="/vagas/$jobId"
                    params={{ jobId: report.targetId }}
                    className="inline-block text-xs text-primary hover:underline"
                  >
                    {texts.myReports.viewJob}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppContainer>
  );
}
