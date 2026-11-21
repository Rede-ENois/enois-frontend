import { useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ModeratorPanelReportView } from "@/types/application/moderation/moderator-panel-report-view";
import {
  type ReportAdminAction,
  ReportsSection as ReportsSectionView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { moderationApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { reportsAdminApi } from "@/lib/api/reports-admin";
import { dataHora } from "@/lib/date/format";

function isAlreadyReviewed(failure: unknown): boolean {
  return failure instanceof ApiError && failure.code === "ALREADY_REVIEWED";
}

export function ReportsSection({ admin }: { admin: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const actionLock = useRef(false);
  const reports = useQuery({
    queryKey: ["moderator", "reports"],
    queryFn: () => moderationApi.reports(),
    retry: false,
  });

  const vote = useMutation({
    mutationFn: ({ reportId, vote }: { reportId: string; vote: "PUNISH" | "DISMISS" }) =>
      moderationApi.vote(reportId, vote),
    onSuccess: async (result) => {
      toast(result.message, "success");
      await queryClient.invalidateQueries({ queryKey: ["moderator", "reports"] });
    },
    onError: () => toast(texts.moderator.reports.voteError, "error"),
  });

  const reconcile = (reportId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["moderator", "reports"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "report", reportId] }),
      queryClient.invalidateQueries({ queryKey: ["moderator", "sanctions"] }),
    ]);

  const adminAction = useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: ReportAdminAction }) => {
      if (action === "penalize") return reportsAdminApi.penalize(reportId);
      if (action === "remove")
        return reportsAdminApi.deletePost(reportId, "Removido pelo painel de moderador");
      if (action === "remove-company") return reportsAdminApi.removeCompany(reportId);
      return reportsAdminApi.warn(reportId);
    },
    onSuccess: async (_result, variables) => {
      const messages: Record<ReportAdminAction, string> = {
        penalize: texts.moderator.reports.penalizeDone,
        remove: texts.moderator.reports.removeDone,
        "remove-company": texts.moderator.reports.removeCompanyDone,
        warn: texts.moderator.reports.warnDone,
      };
      toast(messages[variables.action], "success");
      await reconcile(variables.reportId);
    },
    onError: async (failure, variables) => {
      if (!isAlreadyReviewed(failure)) {
        toast(texts.moderator.reports.actionError, "error");
        return;
      }
      queryClient.setQueryData<ModeratorPanelReportView[]>(["moderator", "reports"], (rows) =>
        rows?.filter((report) => report.reportId !== variables.reportId),
      );
      toast(texts.moderator.reports.alreadyReviewed, "error");
      await reconcile(variables.reportId);
    },
  });

  const applyAdminAction = async (
    reportId: string,
    action: ReportAdminAction,
  ): Promise<boolean> => {
    if (!admin || actionLock.current || vote.isPending) return false;
    actionLock.current = true;
    try {
      await adminAction.mutateAsync({ reportId, action });
      return true;
    } catch (failure) {
      // O conflito confirma que o caso saiu da fila; falhas transitórias preservam a tentativa.
      return isAlreadyReviewed(failure);
    } finally {
      actionLock.current = false;
    }
  };

  return (
    <ReportsSectionView
      reports={(reports.data ?? []).map((report) => ({
        ...report,
        canPenalize:
          Boolean(report.authorId) &&
          ["POST", "COMMENT", "USER", "GROUP_POST", "GROUP_COMMENT", "CALL"].includes(
            report.targetType,
          ),
        createdAtLabel: dataHora(report.createdAt),
        reviewHref: `/moderacao/${encodeURIComponent(report.reportId)}`,
      }))}
      admin={admin}
      loading={reports.isPending}
      error={reports.isError}
      pending={vote.isPending || adminAction.isPending || reports.isFetching}

      onRetry={() => void reports.refetch()}
      onVote={(reportId, choice) => {
        if (actionLock.current || vote.isPending || adminAction.isPending) return;
        vote.mutate({ reportId, vote: choice });
      }}
      onAdminAction={applyAdminAction}
    />
  );
}
