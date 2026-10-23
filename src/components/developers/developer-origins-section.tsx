import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Globe, Trash2 } from "lucide-react";

import { developerOriginsApi } from "@/lib/api";
import { useIsAuthenticated } from "@/lib/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

/**
 * Cadastro da origem que pode consumir a API pública pelo navegador. Sem ela, o preflight de
 * /v1 responde 403 e o CORS não libera a leitura da resposta.
 */
export function DeveloperOriginsSection() {
  const authenticated = useIsAuthenticated();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [origin, setOrigin] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["developer-origins"],
    queryFn: () => developerOriginsApi.list(),
    enabled: authenticated,
    retry: false,
  });

  const add = useMutation({
    mutationFn: () => developerOriginsApi.add(origin.trim()),
    onSuccess: () => {
      setOrigin("");
      toast(texts.developers.originAdded, "success");
      void queryClient.invalidateQueries({ queryKey: ["developer-origins"] });
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.developers.originError, "error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => developerOriginsApi.remove(id),
    onSuccess: () => {
      toast(texts.developers.originRemoved, "success");
      void queryClient.invalidateQueries({ queryKey: ["developer-origins"] });
    },
    onError: () => toast(texts.developers.originError, "error"),
  });

  if (!authenticated) {
    return (
      <p className="mt-2 text-sm text-text-subtle">
        {texts.developers.originsLogin}{" "}
        <Link to="/entrar" className="text-primary hover:underline">
          {texts.common.enter}
        </Link>
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (origin.trim()) add.mutate();
        }}
      >
        <Input
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
          placeholder={texts.developers.originPlaceholder}
          inputMode="url"
          aria-label={texts.developers.originPlaceholder}
        />

        <Button
          type="submit"
          className="w-auto shrink-0 rounded-full"
          disabled={!origin.trim() || add.isPending}
        >
          {texts.developers.originAdd}
        </Button>
      </form>

      <p className="text-xs text-text-subtle">{texts.developers.originValidHint}</p>

      {isLoading ? null : data.length === 0 ? (
        <p className="text-sm text-text-subtle">{texts.developers.originEmpty}</p>
      ) : (
        <ul className="space-y-1.5">
          {data.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border-soft bg-surface-1 px-3 py-2 text-sm"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Globe
                  className={
                    item.blocked
                      ? "h-4 w-4 shrink-0 text-destructive"
                      : "h-4 w-4 shrink-0 text-primary"
                  }
                />

                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-text-strong">{item.origin}</span>

                  {item.blocked && (
                    <span className="truncate text-xs text-destructive">
                      {texts.developers.originBlocked}
                      {item.blockedReason ? ` — ${item.blockedReason}` : ""}
                    </span>
                  )}
                </span>
              </span>

              <button
                type="button"
                onClick={() => remove.mutate(item.id)}
                disabled={remove.isPending}
                title={texts.developers.originRemove}
                aria-label={texts.developers.originRemove}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-subtle transition hover:bg-surface-2 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
