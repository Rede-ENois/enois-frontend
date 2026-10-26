import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { GameView } from "@/types/application/games/game-view";
import {
  GameUpdateDialog as GameUpdateDialogView,
  type GameUpdateValues,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { gamesApi } from "@/lib/api";

/**
 * "Novidades/atualizações": o criador conta o que mudou nesta versão e quem acompanha o criador
 * recebe o aviso. O backend já fazia isso; faltava a tela.
 */
export function GameUpdateDialog({
  game,
  open,
  onOpenChange,
}: {
  game: GameView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const publish = useMutation({
    mutationFn: ({ title, body, version }: GameUpdateValues) =>
      gamesApi.publishUpdate(game.id, {
        title: title.trim(),
        body: body.trim() || undefined,
        version: version.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["games", "updates", game.id] });
      void queryClient.invalidateQueries({ queryKey: ["games", "slug"] });
      toast(texts.games.panel.updatePublished, "success");
      onOpenChange(false);
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.games.panel.updateError, "error"),
  });

  return (
    <GameUpdateDialogView
      open={open}
      onOpenChange={onOpenChange}
      initialVersion={game.version}
      pending={publish.isPending}
      onSubmit={(values) => publish.mutate(values)}
    />
  );
}
