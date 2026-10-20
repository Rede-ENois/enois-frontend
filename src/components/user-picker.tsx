import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { SearchResult } from "@/types/application/search/search-result";
import { AtSign, Loader2 } from "lucide-react";

import { searchApi } from "@/lib/api";

import { UserAvatar } from "@/components/user-avatar";

/**
 * Campo de destinatário com busca de usuário (igual ao marcar @): a pessoa digita nome
 * ou @username, a busca roda com debounce e o clique preenche a CHAVE (o username) —
 * o mesmo identificador que a transferência da faísca fala.
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
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const busca = useQuery({
    queryKey: ["user-picker", query],
    queryFn: () => searchApi.search(query, ["users"], 6),
    enabled: query.trim().length >= 2,
  });

  const resultados: { username: string; nome: string; avatar: string | null }[] = (
    busca.data?.items ?? []
  )
    .map((r: SearchResult) => ({
      username: r.href.split("/").pop() ?? "",
      nome: r.title,
      avatar: r.image,
    }))
    .filter((u) => u.username);

  // fecha ao clicar fora
  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const seleciona = (username: string) => {
    onChange(username);
    setAberto(false);
    setQuery("");
    input.current?.blur();
  };

  const teclas = (e: React.KeyboardEvent) => {
    if (!aberto || resultados.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestaque((d) => (d + 1) % resultados.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => (d - 1 + resultados.length) % resultados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      seleciona(resultados[destaque].username);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  };

  return (
    <div ref={raiz} className="relative">
      <div className="relative">
        <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
        <input
          ref={input}
          value={aberto ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            setAberto(true);
            setDestaque(0);
          }}
          onFocus={() => {
            setQuery(value);
            setAberto(true);
          }}
          onKeyDown={teclas}
          placeholder={placeholder ?? "username"}
          className="h-10 w-full rounded-lg border border-border-soft bg-transparent pl-9 pr-9 text-sm text-text-strong outline-none transition focus-visible:border-primary"
          autoComplete="off"
        />
        {busca.isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-subtle" />
        )}
      </div>

      {aberto && query.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border-soft bg-surface-card p-1 shadow-lg">
          {resultados.length === 0 && !busca.isFetching && (
            <li className="px-3 py-2 text-sm text-text-subtle">Ninguém com esse nome aqui.</li>
          )}
          {resultados.map((u, i) => (
            <li key={u.username}>
              <button
                type="button"
                className={`flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition ${i === destaque ? "bg-surface-2" : "hover:bg-surface-2"}`}
                onClick={() => seleciona(u.username)}
              >
                <UserAvatar src={u.avatar} alt={u.nome} className="h-8 w-8 shrink-0" />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-strong">
                    {u.nome}
                  </span>

                  <span className="block truncate text-xs text-text-subtle">@{u.username}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
