import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ReportReason } from "@/types/application/report/report-reason";
import type { CallCaptureState } from "@/types/components/calls/call-capture-state";
import type { CallReportDialogProps } from "@/types/components/calls/call-report-dialog-props";
import {
  Button,
  CharCounter,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import { Loader2 } from "lucide-react";

import { REPORT_REASONS, callsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { captureToFile, requestCallCapture } from "@/lib/calls/call-capture";
import { useMediaUpload } from "@/lib/use-media-upload";

const MAX_DESCRIPTION = 1200;

/**
 * Denúncia de chamada: escolhe quem, diz o motivo e o que aconteceu, e manda junto uma captura do
 * que está na tela AGORA.
 *
 * A foto é pedida no instante em que o diálogo abre — é o "print do momento da denúncia". Quem
 * tira é a própria sala (iframe do Epapo), porque o app não lê dentro dela; sem imagem legível a
 * denúncia segue só com o relato, e a tela diz isso em vez de fingir que capturou.
 */
export function CallReportDialog({ callId, frameRef, open, onOpenChange }: CallReportDialogProps) {
  const { toast } = useToast();
  const upload = useMediaUpload();
  const [reportedUserId, setReportedUserId] = useState<string | null>(null);
  const [reason, setReason] = useState<ReportReason>("HARASSMENT");
  const [description, setDescription] = useState("");
  const [capture, setCapture] = useState<CallCaptureState>({ status: "pending" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participants = useQuery({
    queryKey: ["calls", callId, "reportable"],
    queryFn: () => callsApi.reportable(callId),
    enabled: open,
  });

  // Cada abertura é uma denúncia nova: limpa o formulário e tira a foto de novo.
  useEffect(() => {
    if (!open) return;
    setReportedUserId(null);
    setReason("HARASSMENT");
    setDescription("");
    setError(null);
    setCapture({ status: "pending" });

    let alive = true;
    void requestCallCapture(frameRef.current).then((dataUrl) => {
      if (!alive) return;
      setCapture(dataUrl ? { status: "ready", dataUrl } : { status: "missing" });
    });
    return () => {
      alive = false;
    };
  }, [open, frameRef]);

  const people = participants.data ?? [];
  const chosen = reportedUserId ?? people[0]?.userId ?? null;

  const send = async () => {
    if (!chosen) return;
    setSending(true);
    setError(null);
    try {
      let mediaId: string | null = null;
      if (capture.status === "ready") {
        const file = captureToFile(capture.dataUrl);
        if (file) {
          // A captura é prova para a moderação: sobe com propósito próprio e não é publicada.
          const uploaded = await upload.upload(file, "REPORT_CAPTURE");
          mediaId = uploaded.mediaId;
        }
      }
      await callsApi.report(callId, {
        reportedUserId: chosen,
        reason,
        description: description.trim(),
        mediaId,
      });
      onOpenChange(false);
      toast(texts.calls.report.success, "success");
    } catch (caught) {
      const code = caught instanceof ApiError ? caught.code : undefined;
      if (code === "ALREADY_REPORTED") {
        setError(texts.calls.report.alreadyReported);
      } else if (code === "NOT_IN_CALL") {
        setError(texts.calls.report.notInCall);
      } else if (code === "DESCRIPTION_TOO_LONG") {
        setError(texts.calls.report.tooLong);
      } else {
        setError(texts.calls.report.error);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Acima do painel da chamada (z-60): o diálogo abre por cima dele, não atrás. */}
      <DialogContent className="z-[70] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.calls.report.title}</DialogTitle>

          <DialogDescription>{texts.calls.report.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="call-report-who">{texts.calls.report.who}</Label>

            {participants.isLoading ? (
              <p className="text-sm text-text-muted">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              </p>
            ) : people.length === 0 ? (
              <p className="text-sm text-text-muted">{texts.calls.report.whoEmpty}</p>
            ) : (
              <select
                id="call-report-who"
                value={chosen ?? ""}
                onChange={(event) => setReportedUserId(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:text-sm"
              >
                {people.map((person) => (
                  <option key={person.userId} value={person.userId}>
                    {person.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="call-report-reason">{texts.calls.report.reason}</Label>

            <select
              id="call-report-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:text-sm"
            >
              {REPORT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {texts.myReports.reason[value] ?? value}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="call-report-description">{texts.calls.report.descriptionLabel}</Label>

            <Textarea
              id="call-report-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={texts.calls.report.descriptionPlaceholder}
              maxLength={MAX_DESCRIPTION}
            />
            <CharCounter length={description.length} max={MAX_DESCRIPTION} />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-text-strong">{texts.calls.report.capture}</p>

            {capture.status === "pending" ? (
              <p className="text-xs text-text-muted">
                <Loader2 className="mr-2 inline h-3 w-3 animate-spin" />
                {texts.calls.report.capturePending}
              </p>
            ) : capture.status === "ready" ? (
              <div className="space-y-1">
                <img
                  src={capture.dataUrl}
                  alt={texts.calls.report.captureAlt}
                  className="w-full rounded-lg border border-border-soft"
                />

                <p className="text-xs text-text-muted">{texts.calls.report.captureReady}</p>
              </div>
            ) : (
              <p className="text-xs text-text-muted">{texts.calls.report.captureMissing}</p>
            )}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            {texts.calls.report.cancel}
          </Button>

          <Button
            className="rounded-full"
            onClick={() => void send()}
            disabled={sending || !chosen || capture.status === "pending"}
          >
            {sending ? texts.calls.report.sending : texts.calls.report.send}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
