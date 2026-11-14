import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { SearchResult } from "@/types/application/search/search-result";
import { UserPicker as UserPickerView } from "@rede-enois/design-system/domain";

import { searchApi } from "@/lib/api";
import { useDebouncedValue } from "@/lib/use-debounced-value";

/**
 * Campo de destinatário com busca de usuário (igual ao marcar @): a busca de usuários roda aqui
 * e o campo preenche a CHAVE (o username) — o mesmo identificador que a transferência da faísca
 * fala.
 */
export function UserPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (username: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  // O campo do DS entrega cada tecla; a consulta sai uma vez, com a pausa da digitação.
  const debouncedQuery = useDebouncedValue(query, 250);

  const busca = useQuery({
    queryKey: ["user-picker", debouncedQuery],
    queryFn: ({ signal }) => searchApi.search(debouncedQuery, ["users"], 6, signal),
    enabled: debouncedQuery.trim().length >= 2,
  });

  const resultados = (busca.data?.items ?? [])
    .map((r: SearchResult) => ({
      username: r.href.split("/").pop() ?? "",
      name: r.title,
      avatar: r.image,
    }))
    .filter((u) => u.username);

  return (
    <UserPickerView
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      options={resultados}
      isFetching={busca.isFetching}
      onQueryChange={setQuery}
    />
  );
}
