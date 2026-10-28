import { texts } from "@/texts";
import { SaciHalloweenDuel } from "@rede-enois/design-system/domain";
import { Button, LoadingState } from "@rede-enois/design-system/ui";

import { useAuth } from "@/lib/use-auth";
import { useSaciDuel } from "@/lib/use-saci-events";

/** The Saci × Halloween duel with its data: tally, choice and result. */
export function SaciDuelPanel() {
  const { duel, choose } = useSaciDuel();
  const { requireAuth } = useAuth();

  if (duel.isPending) return <LoadingState />;
  if (duel.isError) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-text-subtle" role="alert">
        {texts.cosmetics.eventLoadError}

        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => void duel.refetch()}
        >
          {texts.cosmetics.peek.retry}
        </Button>
      </p>
    );
  }
  return (
    <SaciHalloweenDuel
      active={duel.data.active}
      counts={duel.data.counts}
      myChoice={duel.data.myChoice}
      winner={duel.data.winner}
      pending={choose.isPending}
      onChoose={(team) => {
        if (!requireAuth()) return;
        choose.mutate(team);
      }}
    />
  );
}
