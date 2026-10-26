import { useState } from "react";

import { texts } from "@/texts";
import type { ReportDialogProps } from "@/types/components/post/report-dialog-props";
import { ReportDialog as ReportDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { REPORT_REASONS, reportsApi } from "@/lib/api";

/**
 * Denúncia de qualquer alvo. Quem abre manda no estado (`open`/`onOpenChange`) — o card do post
 * guarda isso no store, porque o botão de denunciar fica longe do diálogo.
 */
export function ReportDialog({ targetId, targetType, open, onOpenChange }: ReportDialogProps) {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  return (
    <ReportDialogView
      targetType={targetType}
      reasons={REPORT_REASONS}
      defaultReason="SPAM"
      guidelinesHref="/diretrizes"
      open={open}
      onOpenChange={onOpenChange}
      sending={sending}
      onSubmit={async ({ reason, description }) => {
        setSending(true);
        try {
          await reportsApi.create({ targetId, targetType, reason, description });
          onOpenChange(false);
          toast(texts.posts.report.success, "success");
          return true;
        } catch {
          toast(texts.posts.report.error, "error");
          return false;
        } finally {
          setSending(false);
        }
      }}
    />
  );
}
