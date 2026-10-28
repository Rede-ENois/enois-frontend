import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { GifPickerDialogProps } from "@/types/components/post/gif-picker-dialog-props";
import { GifPickerDialog as GifPickerDialogView } from "@rede-enois/design-system/domain";

import { gifsApi } from "@/lib/api/gifs";

/**
 * Seletor de GIF do comentário. Busca por assunto (o provedor — Tenor ou GIPHY — é o que estiver
 * configurado no servidor) e, sem termo digitado, mostra o que está em alta.
 */
export function GifPickerDialog({ open, onOpenChange, onSelect }: GifPickerDialogProps) {
  const [term, setTerm] = useState("");

  const { data, isFetching, isError } = useQuery({
    queryKey: ["gifs", "search", term],
    queryFn: () => gifsApi.search(term),
    enabled: open,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return (
    <GifPickerDialogView
      open={open}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      onTermChange={setTerm}
      data={data}
      isFetching={isFetching}
      isError={isError}
    />
  );
}
