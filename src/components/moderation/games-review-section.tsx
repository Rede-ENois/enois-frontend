import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { GamePlayer } from "@rede-enois/design-system/domain";
import { ListRowSkeletons } from "@rede-enois/design-system/patterns";
import { Button, Input, useToast } from "@rede-enois/design-system/ui";
import { Gamepad2 } from "lucide-react";

import { moderationApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";

/** Fila de jogos enviados pela comunidade: testar no mesmo quadro isolado e aprovar/recusar. */
export function GamesReviewSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [testando, setTestando] = useState<string | null>(null);
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  const { data: jogos, isLoading } = useQuery({
    queryKey: ["moderator", "games"],
    queryFn: () => moderationApi.games(30),
    retry: false,
  });

  const decidir = useMutation({
    mutationFn: ({ id, aprovar, note }: { id: string; aprovar: boolean; note?: string }) =>
      aprovar ? moderationApi.approveGame(id, note) : moderationApi.rejectGame(id, note ?? ""),
    onSuccess: (_resposta, vars) => {
      toast(
        vars.aprovar ? texts.moderator.games.approved : texts.moderator.games.rejected,
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["moderator", "games"] });
    },
    onError: () => toast(texts.moderator.games.error, "error"),
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
        {texts.moderator.games.title}
      </h2>

      {isLoading ? (
        <ListRowSkeletons />
      ) : (jogos?.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-text-subtle">
          {texts.moderator.games.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {jogos!.map((g) => {
            const motivo = motivos[g.id] ?? "";
            const precisaMotivo = motivo.trim().length === 0;

            return (
              <li
                key={g.id}
                className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4"
              >
                <div className="flex gap-3">
                  {g.cover && (
                    <img
                      src={g.cover}
                      alt=""
                      className="h-14 w-24 shrink-0 rounded-lg border border-border-soft object-cover"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{g.title}</p>

                    <p className="break-words text-xs text-text-subtle">
                      @{g.username ?? g.userId}
                      {g.submittedAt ? ` · ${dataCurta(g.submittedAt)}` : ""}
                      {g.tags ? ` · ${g.tags}` : ""}
                    </p>
                  </div>
                </div>

                {g.description && (
                  <p className="whitespace-pre-line text-sm font-normal text-muted-foreground">
                    {g.description}
                  </p>
                )}

                <p className="break-all text-xs text-text-subtle">{g.url}</p>

                {testando === g.id ? (
                  <GamePlayer url={g.url} title={g.title} aspect={g.aspect} autoStart />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => setTestando(g.id)}
                  >
                    <Gamepad2 className="h-3.5 w-3.5" />

                    <>{texts.moderator.games.play}</>
                  </Button>
                )}

                <Input
                  value={motivo}
                  onChange={(event) =>
                    setMotivos((current) => ({ ...current, [g.id]: event.target.value }))
                  }
                  placeholder={texts.moderator.games.notePlaceholder}
                  maxLength={300}
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={decidir.isPending}
                    onClick={() => decidir.mutate({ id: g.id, aprovar: true, note: motivo })}
                  >
                    {texts.moderator.games.approve}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full"
                    disabled={decidir.isPending || precisaMotivo}
                    onClick={() => decidir.mutate({ id: g.id, aprovar: false, note: motivo })}
                  >
                    {texts.moderator.games.reject}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
