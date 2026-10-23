import { useEffect, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { GameView } from "@/types/application/games/game-view";
import { ImagePlus, Trash2, X } from "lucide-react";

import { gamesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

const STAGES = [
  ["IN_DEVELOPMENT", "Em desenvolvimento"],
  ["DEMO", "Demo"],
  ["EARLY_ACCESS", "Acesso antecipado"],
  ["RELEASED", "Lançado"],
  ["PAUSED", "Pausado"],
] as const;

const ASPECTS = [
  ["WIDESCREEN", "Widescreen (16:9)"],
  ["CLASSIC", "Clássico (4:3)"],
  ["SQUARE", "Quadrado (1:1)"],
  ["PORTRAIT", "Retrato (9:16)"],
] as const;

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

  const [title, setTitle] = useState(game.title);
  const [slug, setSlug] = useState(game.slug);
  const [url, setUrl] = useState(game.url);
  const [tags, setTags] = useState(game.tags ?? "");
  const [shortDescription, setShortDescription] = useState(game.shortDescription ?? "");
  const [description, setDescription] = useState(game.description ?? "");
  const [genres, setGenres] = useState(game.genres.join(", "));
  const [languages, setLanguages] = useState(game.languages.join(", "));
  const [controls, setControls] = useState(game.controls ?? "");
  const [requirements, setRequirements] = useState(game.requirements ?? "");
  const [contentWarnings, setContentWarnings] = useState(game.contentWarnings ?? "");
  const [stage, setStage] = useState<string>(game.stage);
  const [distribution, setDistribution] = useState<string>(game.distribution);
  const [priceCoins, setPriceCoins] = useState(String(game.priceCoins ?? 0));
  const [aspect, setAspect] = useState<string>(game.aspect);
  const [version, setVersion] = useState(game.version ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(game.websiteUrl ?? "");
  const [supportUrl, setSupportUrl] = useState(game.supportUrl ?? "");
  const [icon, setIcon] = useState<string | null>(game.icon ?? null);
  const [banner, setBanner] = useState<string | null>(game.banner ?? null);
  const [bannerHtml, setBannerHtml] = useState(game.bannerHtml ?? "");
  const [uploading, setUploading] = useState<"icon" | "banner" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // O diálogo é reaproveitado entre jogos: abrir com outro jogo precisa re-semear os campos.
  useEffect(() => {
    if (!open) return;
    setTitle(game.title);
    setSlug(game.slug);
    setUrl(game.url);
    setTags(game.tags ?? "");
    setShortDescription(game.shortDescription ?? "");
    setDescription(game.description ?? "");
    setGenres(game.genres.join(", "));
    setLanguages(game.languages.join(", "));
    setControls(game.controls ?? "");
    setRequirements(game.requirements ?? "");
    setContentWarnings(game.contentWarnings ?? "");
    setStage(game.stage);
    setDistribution(game.distribution);
    setPriceCoins(String(game.priceCoins ?? 0));
    setAspect(game.aspect);
    setVersion(game.version ?? "");
    setWebsiteUrl(game.websiteUrl ?? "");
    setSupportUrl(game.supportUrl ?? "");
    setIcon(game.icon ?? null);
    setBanner(game.banner ?? null);
    setBannerHtml(game.bannerHtml ?? "");
  }, [open, game]);

  const save = useMutation({
    mutationFn: () =>
      gamesApi.edit(game.id, {
        title: title.trim(),
        slug: slug.trim() || undefined,
        url: url.trim(),
        tags: tags.trim() || null,
        cover: game.cover ?? null,
        shortDescription: shortDescription.trim() || null,
        description: description.trim() || null,
        genres: genres.trim() || null,
        languages: languages.trim() || null,
        controls: controls.trim() || null,
        requirements: requirements.trim() || null,
        contentWarnings: contentWarnings.trim() || null,
        stage,
        distribution,
        priceCoins: Number.parseInt(priceCoins, 10) || 0,
        aspect,
        version: version.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        supportUrl: supportUrl.trim() || null,
        // As capturas atuais seguem intactas: esta tela não mexe na galeria.
        mediaIds: game.mediaIds,
        icon,
        banner,
        bannerHtml: bannerHtml.trim() || null,
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

  async function uploadImage(kind: "icon" | "banner", file: File | null | undefined) {
    if (!file) return;
    setUploading(kind);
    try {
      const result = await uploader.upload(file, kind === "icon" ? "GAME_ICON" : "GAME_BANNER");
      if (kind === "icon") setIcon(result.cdnUrl);
      else setBanner(result.cdnUrl);
    } catch (error) {
      toast(error instanceof Error ? error.message : texts.games.panel.uploadError, "error");
    } finally {
      setUploading(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-normal">{texts.games.editor.title}</DialogTitle>

            <DialogDescription>{texts.games.editor.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Identidade */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-text-strong">
                {texts.games.editor.identityTitle}
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-text-subtle">
                  {texts.games.editor.icon}
                </Label>

                <div className="flex flex-wrap items-center gap-2">
                  {icon ? (
                    <span className="relative">
                      <img
                        src={resolveCdnUrl(icon)}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />

                      <button
                        type="button"
                        aria-label={texts.games.editor.removeIcon}
                        title={texts.games.editor.removeIcon}
                        onClick={() => setIcon(null)}
                        className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary-text">
                      <ImagePlus className="h-5 w-5" />
                    </span>
                  )}

                  <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-border-soft px-3 text-sm font-medium transition hover:bg-muted">
                    {uploading === "icon" ? texts.common.loading : texts.games.editor.uploadImage}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        void uploadImage("icon", file);
                      }}
                    />
                  </label>

                  <p className="text-xs text-text-subtle">{texts.games.editor.iconHint}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-text-subtle">
                  {texts.games.editor.banner}
                </Label>

                <div className="space-y-2">
                  {banner ? (
                    <span className="relative block">
                      <img
                        src={resolveCdnUrl(banner)}
                        alt=""
                        className="h-24 w-full rounded-xl object-cover"
                      />

                      <button
                        type="button"
                        aria-label={texts.games.editor.removeBanner}
                        title={texts.games.editor.removeBanner}
                        onClick={() => setBanner(null)}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-border-soft px-3 text-sm font-medium transition hover:bg-muted">
                      {uploading === "banner"
                        ? texts.common.loading
                        : texts.games.editor.uploadPhoto}

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          void uploadImage("banner", file);
                        }}
                      />
                    </label>

                    <p className="text-xs text-text-subtle">{texts.games.editor.bannerHint}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-text-subtle">
                  {texts.games.editor.bannerHtml}
                </Label>

                <Textarea
                  value={bannerHtml}
                  onChange={(event) => setBannerHtml(event.target.value)}
                  rows={3}
                  className="bg-muted font-mono text-xs"
                  placeholder={'<div style="background:linear-gradient(...)">…</div>'}
                />

                <p className="text-xs text-text-subtle">{texts.games.editor.bannerHtmlHint}</p>
              </div>
            </section>

            {/* Endereço */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-text-strong">
                {texts.games.editor.addressTitle}
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-text-subtle">
                    {texts.games.editor.titleField}
                  </Label>

                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={200}
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-text-subtle">
                    {texts.games.editor.slug}
                  </Label>

                  <Input
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    maxLength={120}
                    className="bg-muted"
                  />

                  <p className="break-all text-xs text-text-subtle">
                    /games/{game.username ?? "@"}/{slug.trim() || game.slug}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-text-subtle">
                  {texts.games.editor.url}
                </Label>

                <Input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className="bg-muted"
                />
              </div>
            </section>

            {/* Ficha */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-text-strong">
                {texts.games.editor.fichaTitle}
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-text-subtle">
                  {texts.games.editor.shortDescription}
                </Label>

                <Input
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  maxLength={300}
                  className="bg-muted"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-text-subtle">
                  {texts.games.editor.descriptionField}
                </Label>

                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="bg-muted"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={texts.games.editor.genres} value={genres} onChange={setGenres} />
                <Field
                  label={texts.games.editor.languages}
                  value={languages}
                  onChange={setLanguages}
                />
                <Field
                  label={texts.games.editor.controls}
                  value={controls}
                  onChange={setControls}
                />
                <Field
                  label={texts.games.editor.requirements}
                  value={requirements}
                  onChange={setRequirements}
                />
                <Field
                  label={texts.games.editor.warnings}
                  value={contentWarnings}
                  onChange={setContentWarnings}
                />
                <Field label={texts.games.editor.tags} value={tags} onChange={setTags} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  label={texts.games.editor.stage}
                  value={stage}
                  onChange={setStage}
                  options={STAGES}
                />
                <SelectField
                  label={texts.games.editor.aspect}
                  value={aspect}
                  onChange={setAspect}
                  options={ASPECTS}
                />
                <SelectField
                  label={texts.games.editor.distribution}
                  value={distribution}
                  onChange={setDistribution}
                  options={[
                    ["FREE", texts.games.game.free],
                    ["PAID", texts.games.editor.paid],
                  ]}
                />

                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-text-subtle">
                    {texts.games.editor.price}
                  </Label>

                  <Input
                    type="number"
                    min={0}
                    value={priceCoins}
                    onChange={(event) => setPriceCoins(event.target.value)}
                    className="bg-muted"
                  />
                </div>

                <Field label={texts.games.editor.version} value={version} onChange={setVersion} />
                <Field
                  label={texts.games.editor.websiteUrl}
                  value={websiteUrl}
                  onChange={setWebsiteUrl}
                />
                <Field
                  label={texts.games.editor.supportUrl}
                  value={supportUrl}
                  onChange={setSupportUrl}
                />
              </div>
            </section>

            <Button
              className="w-full rounded-full"
              disabled={title.trim().length < 3 || url.trim() === "" || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? texts.common.saving : texts.common.save}
            </Button>

            {game.status !== "SUBMITTED" && (
              <Button
                variant="outline"
                className="w-full rounded-full gap-1.5 text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />

                <>{texts.games.editor.delete}</>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fora do diálogo de edição: um diálogo dentro do outro disputa o foco. */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={texts.games.editor.deleteTitle}
        description={texts.games.editor.deleteConfirm}
        confirmLabel={texts.games.editor.delete}
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-normal text-text-subtle">{label}</Label>

      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-muted"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-normal text-text-subtle">{label}</Label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-9 w-full rounded-md border border-transparent bg-muted px-3 py-2 text-sm font-normal text-text-strong outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
