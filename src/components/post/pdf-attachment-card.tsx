import { useEffect, useState } from "react";

import { Button } from "@rede-enois/design-system/ui";

import { mountPdfThumbnail } from "@/lib/pdf/mount-pdf-thumbnail";
import { pdfFileNameOf } from "@/lib/pdf/pdf-url";

import { PdfReaderDialog } from "./pdf-reader-dialog";

/**
 * Cartão de anexo/link PDF em publicações, compositor e comentários: exibe miniatura da
 * primeira página e contagem de páginas, abrindo o leitor interativo ao tocar/clicar.
 */
export function PdfAttachmentCard({
  url,
  title,
  file,
}: {
  url: string;
  title?: string | null;
  file?: File;
}) {
  const [open, setOpen] = useState(false);
  const [cardNode, setCardNode] = useState<HTMLButtonElement | null>(null);
  const label = title?.trim() || pdfFileNameOf(url);

  useEffect(() => {
    if (!cardNode) return;
    return mountPdfThumbnail(cardNode, { url, title: label, file });
  }, [cardNode, url, label, file]);

  return (
    <>
      <Button
        ref={setCardNode}
        type="button"
        variant="outline"
        data-pdf-card-trigger="true"
        aria-label={`Abrir documento PDF: ${label}`}
        onClick={() => setOpen(true)}
      />
      <PdfReaderDialog open={open} onOpenChange={setOpen} url={url} title={label} file={file} />
    </>
  );
}
