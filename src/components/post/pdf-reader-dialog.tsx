import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rede-enois/design-system/ui";

import { mountPdfReader } from "@/lib/pdf/mount-pdf-reader";
import { pdfFileNameOf } from "@/lib/pdf/pdf-url";

/**
 * Leitor de PDF confortável e acessível dentro do app, com ajuste à largura, zoom, modos de
 * conforto visual (Original, Sépia e Noturno) e paginação ergonômica para mobile e desktop.
 */
export function PdfReaderDialog({
  open,
  onOpenChange,
  url,
  title,
  file,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string | null;
  file?: File;
}) {
  const [hostNode, setHostNode] = useState<HTMLDivElement | null>(null);
  const resolvedTitle = title?.trim() || pdfFileNameOf(url);

  useEffect(() => {
    if (!open || !hostNode) return;
    return mountPdfReader(hostNode, { url, fileName: resolvedTitle, file });
  }, [open, hostNode, url, resolvedTitle, file]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={setHostNode} data-pdf-reader-dialog="true">
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>

          <DialogDescription>
            Alterne entre leitura paginada ou contínua, ajuste o zoom ou escolha o modo de conforto.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
