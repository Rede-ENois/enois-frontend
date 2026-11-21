import { useState } from "react";

import { Badge, Button } from "@rede-enois/design-system/ui";
import { BookOpen, FileText } from "lucide-react";

import { pdfFileNameOf } from "@/lib/pdf/pdf-url";

import { PdfReaderDialog } from "./pdf-reader-dialog";

/**
 * Cartão de anexo/link PDF em publicações e comentários: abre o leitor interativo do app em vez
 * de quebrar como imagem ou jogar a pessoa para uma aba crua no celular.
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
  const label = title?.trim() || pdfFileNameOf(url);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        data-pdf-card-trigger="true"
        onClick={() => setOpen(true)}
      >
        <FileText aria-hidden="true" />

        <Badge variant="secondary">PDF</Badge>
        {label}
        <BookOpen aria-hidden="true" />
      </Button>

      <PdfReaderDialog open={open} onOpenChange={setOpen} url={url} title={label} file={file} />
    </>
  );
}
