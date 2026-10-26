import { useQuery } from "@tanstack/react-query";

import { DailyGamesPanel as DailyGamesPanelView } from "@rede-enois/design-system/domain";

import {
  dailyBlocksApi,
  dailyGamesRewardsApi,
  dailyMazeApi,
  dailyWordsApi,
} from "@/lib/api/daily-games";
import { formatFaisca } from "@/lib/faisca";

import { DailyBlocks } from "@/components/daily-blocks";
import { DailyMaze } from "@/components/daily-maze";
import { DailyWord } from "@/components/daily-word";

/**
 * Os jogos diários (palavras, labirinto e blocos) como uma CATEGORIA dentro de "Jogos da
 * comunidade".
 *
 * <p>Até aqui era uma página à parte (/jogos-diarios) e um item à parte no menu. Agora o painel
 * mora dentro de /games: a pessoa troca de categoria no mesmo lugar, e o endereço antigo continua
 * funcionando (a rota redireciona para cá).
 */
export function DailyGamesPanel() {
  const words = useQuery({
    queryKey: ["daily-games", "words", "today"],
    queryFn: () => dailyWordsApi.today(),
  });
  const maze = useQuery({
    queryKey: ["daily-games", "maze", "today"],
    queryFn: () => dailyMazeApi.today(),
  });
  const blocks = useQuery({
    queryKey: ["daily-games", "blocks", "today"],
    queryFn: () => dailyBlocksApi.today(),
  });
  const prizes = useQuery({
    queryKey: ["daily-games", "rewards", "prizes"],
    queryFn: () => dailyGamesRewardsApi.prizes(),
  });

  return (
    <DailyGamesPanelView
      wordsStatus={words.data?.status}
      mazeStatus={maze.data?.status}
      blocksStatus={blocks.data?.status}
      prizes={prizes.data?.tiers.map((tier) => ({
        label: tier.label,
        amountLabel: formatFaisca(tier.amount),
      }))}
      communityHref="/games"
      words={<DailyWord />}
      maze={<DailyMaze />}
      blocks={<DailyBlocks />}
    />
  );
}
