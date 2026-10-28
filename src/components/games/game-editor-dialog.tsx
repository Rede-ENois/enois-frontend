import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { GameView } from "@/types/application/games/game-view";
import {
  GameEditorDialog as GameEditorDialogView,
  type GameEditorValues,
  type GameImageKind,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { gamesApi } from "@/lib/api";
import { useMediaUpload } from "@/lib/use-media-upload";

/**
 * A loja do lado do CRIADOR: editar a ficha, escolher o endereço do jogo, subir ícone e banner
 * (foto ou HTML) e tirar o jogo da loja.
 *
 * O diálogo recebe o jogo já carregado e SÓ grava no PATCH: a edição não passa pela moderação de
 * novo (corrigir a ficha não é publicar outro jogo) — jogo recusado volta para a fila pelo
 * "reenviar", que é outra ação.
 */
export function GameEditorDialog({
  game,
  open,
  onOpenChange,
  onDeleted,
}: {
  game: GameView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const uploader = useMediaUpload();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useMutation({
    mutationFn: (values: GameEditorValues) =>
      gamesApi.edit(game.id, {
        title: values.title.trim(),
        slug: values.slug.trim() || undefined,
        url: values.url.trim(),
        tags: values.tags.trim() || null,
        cover: game.cover ?? null,
        shortDescription: values.shortDescription.trim() || null,
        description: values.description.trim() || null,
        genres: values.genres.trim() || null,
        languages: values.languages.trim() || null,
        controls: values.controls.trim() || null,
        requirements: values.requirements.trim() || null,
        contentWarnings: values.contentWarnings.trim() || null,
        stage: values.stage,
        distribution: values.distribution,
        priceCoins: Number.parseInt(values.priceCoins, 10) || 0,
        aspect: values.aspect,
        version: values.version.trim() || null,
        websiteUrl: values.websiteUrl.trim() || null,
        supportUrl: values.supportUrl.trim() || null,
        // As capturas atuais seguem intactas: esta tela não mexe na galeria.
        mediaIds: game.mediaIds,
        icon: values.icon,
        banner: values.banner,
        bannerHtml: values.bannerHtml.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["games"] });
      toast(texts.games.panel.saved, "success");
      onOpenChange(false);
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.games.panel.error, "error"),
  });

  const remove = useMutation({
    mutationFn: () => gamesApi.remove(game.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["games"] });
      toast(texts.games.editor.deleted, "success");
      setConfirmDelete(false);
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.games.panel.error, "error"),
  });

  async function uploadImage(kind: GameImageKind, file: File): Promise<string | null> {
    try {
      const result = await uploader.upload(file, kind === "icon" ? "GAME_ICON" : "GAME_BANNER");
      return result.cdnUrl;
    } catch (error) {
      toast(error instanceof Error ? error.message : texts.games.panel.uploadError, "error");
      return null;
    }
  }

  return (
    <GameEditorDialogView
      game={game}
      open={open}
      onOpenChange={onOpenChange}
      savePending={save.isPending}
      onSave={(values) => save.mutate(values)}
      onUploadImage={uploadImage}
      deleteConfirmOpen={confirmDelete}
      onDeleteConfirmOpenChange={setConfirmDelete}
      deletePending={remove.isPending}
      onDelete={() => remove.mutate()}
    />
  );
}
