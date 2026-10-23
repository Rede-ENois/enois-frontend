import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import type { GameTab } from "@/types/routes/daily-games/game-tab";
import { Boxes, CheckCircle2, Flame, Gamepad2, Map, Sparkles, Trophy, Type } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<GameTab>("words");

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

  const wordsWon = words.data?.status === "WON";
  const mazeWon = maze.data?.status === "WON";
  const blocksWon = blocks.data?.status === "WON";

  const completedCount = (wordsWon ? 1 : 0) + (mazeWon ? 1 : 0) + (blocksWon ? 1 : 0);

  function getStatusBadge(status?: string) {
    if (status === "WON") {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Concluído
        </span>
      );
    }
    if (status === "IN_PROGRESS" || status === "PLAYING") {
      return <span className="text-[11px] font-medium text-amber-500">Em andamento</span>;
    }
    return <span className="text-[11px] font-medium text-muted-foreground">Disponível</span>;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Hub */}
      <header className="surface-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <Gamepad2 className="h-6 w-6 text-primary" /> Jogos diários
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Três desafios por dia para exercitar o cérebro e competir com a comunidade.
            </p>
          </div>

          <Link
            to="/games"
            className="text-xs sm:text-sm font-medium text-primary underline shrink-0"
          >
            Explorar jogos da comunidade
          </Link>
        </div>

        {/* Barra de Progresso do Dia */}
        <div className="mt-5 rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4">
          <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" />
              Desafios concluídos hoje
            </span>

            <span className="flex items-center gap-1 font-semibold text-foreground">
              {completedCount === 3 && (
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
              )}
              {completedCount} de 3
            </span>
          </div>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>
        {/* Prêmios em faísca do dia */}
        {prizes.data && prizes.data.tiers.length > 0 && (
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Prêmios em faíscas
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
              {prizes.data.tiers.map((tier) => (
                <span key={tier.label} className="text-xs text-muted-foreground">
                  {tier.label}:{" "}
                  <span className="font-semibold text-foreground">{formatFaisca(tier.amount)}</span>
                </span>
              ))}
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              O placar fecha e as faíscas caem na carteira depois que o dia termina — quem completa
              o desafio, mesmo fora do top 10, recebe.
            </p>
          </div>
        )}
      </header>

      {/* Seletor de Abas dos Jogos */}
      <nav
        className="grid grid-cols-3 gap-2 p-1 bg-muted/40 rounded-xl border border-border/50"
        aria-label="Selecionar jogo diário"
      >
        <button
          type="button"
          onClick={() => setActiveTab("words")}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-150 touch-manipulation ${
            activeTab === "words"
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Type className="h-4 w-4 text-emerald-500" />

            <span>Palavras</span>
          </div>
          {getStatusBadge(words.data?.status)}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("maze")}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-150 touch-manipulation ${
            activeTab === "maze"
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Map className="h-4 w-4 text-blue-500" />

            <span>Labirinto</span>
          </div>
          {getStatusBadge(maze.data?.status)}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("blocks")}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-150 touch-manipulation ${
            activeTab === "blocks"
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Boxes className="h-4 w-4 text-purple-500" />

            <span>Blocos</span>
          </div>
          {getStatusBadge(blocks.data?.status)}
        </button>
      </nav>

      {/* Conteúdo da Aba Ativa */}
      <div>
        {activeTab === "words" && <DailyWord />}
        {activeTab === "maze" && <DailyMaze />}
        {activeTab === "blocks" && <DailyBlocks />}
      </div>
    </div>
  );
}
