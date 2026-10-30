import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { UserAvatar } from "@rede-enois/design-system/domain";
import { Button, Input, LoadingState, Textarea, useToast } from "@rede-enois/design-system/ui";
import { ArrowLeft, Camera, Image as ImageIcon } from "lucide-react";

import { corporateApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { isValidNametag, nametagPath, normalizeNametag } from "@/lib/corporate/nametag";
import { requireAuth } from "@/lib/require-auth";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { AppContainer } from "@/components/app-container";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

export const Route = createFileRoute("/profissional")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.corporate.seoTitle }] }),
  component: Profissional,
});

const FIELD_CLASS = "border-transparent bg-muted";

/**
 * O perfil profissional: criar, editar, ativar/desativar e — o ponto sensível — trazer
 * dados do perfil social SOMENTE com escolha campo a campo (nada é copiado sozinho).
 */
function Profissional() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    username: "",
    name: "",
    headline: "",
    bio: "",
    location: "",
    industry: "",
    externalLinks: "",
    avatar: "",
    banner: "",
    bannerHtml: "",
  });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const avatarUpload = useMediaUpload();
  const bannerUpload = useMediaUpload();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const authenticated = useIsAuthenticated();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => corporateApi.me(),
    enabled: authenticated,
    staleTime: 30_000,
  });

  // Primeira carga do formulário com o que já existe (não sobrescreve o que a pessoa digitou).
  useEffect(() => {
    if (profile?.exists && loadedFor !== profile.username) {
      setLoadedFor(profile.username);
      setForm({
        username: profile.username,
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        industry: profile.industry,
        externalLinks: profile.externalLinks,
        avatar: profile.avatar,
        banner: profile.banner,
        bannerHtml: profile.bannerHtml,
      });
    }
  }, [profile, loadedFor]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["business-profile"] });
  };

  const create = useMutation({
    mutationFn: () => corporateApi.create(form.username.trim().toLowerCase(), form.name.trim()),
    onSuccess: () => {
      toast(texts.corporate.saved, "success");
      refresh();
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.corporate.saveError, "error"),
  });

  const save = useMutation({
    mutationFn: async () => {
      await corporateApi.rename(form.name.trim());
      return corporateApi.updateDetails({
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        industry: form.industry.trim(),
        externalLinks: form.externalLinks.trim(),
        // O PATCH substitui o perfil inteiro: mandar sem estes dois apagaria foto e capa.
        avatar: form.avatar,
        banner: form.banner,
        bannerHtml: form.bannerHtml,
      });
    },
    onSuccess: () => {
      toast(texts.corporate.saved, "success");
      refresh();
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.corporate.saveError, "error"),
  });

  /**
   * O nametag tem ação própria: trocar o @ não depende (nem fica preso) ao resto do formulário —
   * se o nametag escolhido estiver em uso, os outros campos não deixam de salvar.
   */
  const changeNametag = useMutation({
    mutationFn: () => corporateApi.changeUsername(normalizeNametag(form.username)),
    onSuccess: (updated) => {
      setForm((current) => ({ ...current, username: updated.username }));
      setLoadedFor(updated.username);
      toast(texts.corporate.nametagChanged, "success");
      void queryClient.invalidateQueries({ queryKey: ["business-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["corporate-public"] });
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.corporate.saveError, "error"),
  });

  const activate = useMutation({
    mutationFn: () => corporateApi.activate(),
    onSuccess: () => {
      toast(texts.corporate.activated, "success");
      refresh();
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.corporate.saveError, "error"),
  });

  const deactivate = useMutation({
    mutationFn: () => corporateApi.deactivate(),
    onSuccess: () => {
      toast(texts.corporate.deactivated, "success");
      refresh();
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.corporate.saveError, "error"),
  });

  /** Sobe a imagem e grava o perfil inteiro com o novo campo (o PATCH substitui tudo). */
  const uploadImage = (file: File | undefined, purpose: "AVATAR" | "BANNER") => {
    if (!file) return;
    const upload = purpose === "AVATAR" ? avatarUpload : bannerUpload;
    void upload
      .upload(file, purpose)
      .then(async (result) => {
        const nextAvatar = purpose === "AVATAR" ? result.cdnUrl : form.avatar;
        const nextBanner = purpose === "BANNER" ? result.cdnUrl : form.banner;
        setForm((current) => ({ ...current, avatar: nextAvatar, banner: nextBanner }));
        await corporateApi.updateDetails({
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          location: form.location.trim(),
          industry: form.industry.trim(),
          externalLinks: form.externalLinks.trim(),
          avatar: nextAvatar,
          banner: nextBanner,
          bannerHtml: form.bannerHtml,
        });
        toast(texts.corporate.saved, "success");
        refresh();
      })
      .catch(() => toast(texts.corporate.uploadError, "error"));
  };

  const { data: preview } = useQuery({
    queryKey: ["business-profile", "import-preview"],
    queryFn: () => corporateApi.importPreview(),
    enabled: importOpen && Boolean(profile?.exists),
  });

  const importFields = useMutation({
    mutationFn: () =>
      corporateApi.importFromSocial(Object.keys(chosen).filter((field) => chosen[field])),
    onSuccess: (updated) => {
      toast(texts.corporate.imported, "success");
      setImportOpen(false);
      setChosen({});
      // O import NÃO pode deixar o formulário no estado antigo: o PATCH de "Salvar" substitui
      // o perfil inteiro, então os campos desatualizados apagariam a importação na hora em
      // que a pessoa salvasse qualquer ajuste (era o "importei tudo e nada fica").
      setForm({
        username: updated.username,
        name: updated.name,
        headline: updated.headline,
        bio: updated.bio,
        location: updated.location,
        industry: updated.industry,
        externalLinks: updated.externalLinks,
        avatar: updated.avatar,
        banner: updated.banner,
        bannerHtml: updated.bannerHtml,
      });
      setLoadedFor(updated.username);
      refresh();
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.corporate.saveError, "error"),
  });

  if (isLoading || !profile) {
    return (
      <AppContainer>
        <div className="mx-auto w-full max-w-3xl">
          <LoadingState />
        </div>
      </AppContainer>
    );
  }

  const importable = preview
    ? (Object.entries(preview).filter(([, value]) => Boolean(value)) as [string, string][])
    : [];

  const nametagDigitado = normalizeNametag(form.username);
  const nametagValido = isValidNametag(form.username);
  const nametagMudou =
    Boolean(profile.exists) && nametagValido && nametagDigitado !== profile.username;

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.post.back}</>
        </Link>

        <div className="surface-card space-y-2 p-4 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight">{texts.corporate.title}</h1>

          <p className="text-sm text-muted-foreground">{texts.corporate.subtitle}</p>

          {profile.exists && (
            <p className="text-sm text-text-subtle">
              {texts.corporate.statusLabel}: <b>{texts.corporate.status[profile.status]}</b>
            </p>
          )}
        </div>

        {!profile.exists && (
          <div className="surface-card space-y-4 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">{texts.corporate.notCreatedTitle}</h2>

            <p className="text-sm text-muted-foreground">{texts.corporate.notCreatedBody}</p>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{texts.corporate.username}</label>

              <Input
                aria-label={texts.corporate.username}
                className={FIELD_CLASS}
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                maxLength={30}
              />

              <p className="text-xs text-text-subtle">{texts.corporate.usernameHint}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{texts.corporate.name}</label>

              <Input
                aria-label={texts.corporate.name}
                className={FIELD_CLASS}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={160}
              />
            </div>

            <Button
              className="w-full rounded-full"
              disabled={create.isPending || !form.username.trim() || !form.name.trim()}
              onClick={() => create.mutate()}
            >
              {texts.corporate.create}
            </Button>
          </div>
        )}

        {profile.exists && (
          <>
            <div className="surface-card space-y-4 p-4 sm:p-6">
              {form.bannerHtml.trim() ? (
                <SandboxedHtmlFrame
                  html={form.bannerHtml}
                  title={texts.corporate.bannerHtml}
                  className="h-28 w-full rounded-xl"
                />
              ) : form.banner ? (
                <div className="h-28 w-full overflow-hidden rounded-xl bg-surface-2">
                  <img
                    src={resolveCdnUrl(form.banner)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <UserAvatar
                  src={form.avatar || undefined}
                  alt={profile.name}
                  className="h-12 w-12"
                />

                <div className="min-w-0">
                  <p className="truncate font-medium text-text-strong">{profile.name}</p>

                  <p className="truncate text-sm text-text-subtle">@{profile.username}</p>
                </div>

                <div className="ml-auto flex flex-wrap gap-2">
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      uploadImage(event.target.files?.[0], "AVATAR");
                      event.target.value = "";
                    }}
                  />

                  <Button
                    variant="outline"
                    className="w-auto rounded-full"
                    disabled={avatarUpload.status === "uploading"}
                    onClick={() => avatarRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />

                    {avatarUpload.status === "uploading"
                      ? texts.corporate.uploading
                      : texts.corporate.changeAvatar}
                  </Button>

                  <input
                    ref={bannerRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      uploadImage(event.target.files?.[0], "BANNER");
                      event.target.value = "";
                    }}
                  />

                  <Button
                    variant="outline"
                    className="w-auto rounded-full"
                    disabled={bannerUpload.status === "uploading"}
                    onClick={() => bannerRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />

                    {bannerUpload.status === "uploading"
                      ? texts.corporate.uploading
                      : texts.corporate.changeBanner}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{texts.corporate.name}</label>

                <Input
                  aria-label={texts.corporate.name}
                  className={FIELD_CLASS}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  maxLength={160}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{texts.corporate.nametag}</label>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <span className="text-sm text-text-subtle">@</span>

                    <Input
                      className={`${FIELD_CLASS} min-w-0`}
                      value={form.username}
                      onChange={(event) => setForm({ ...form, username: event.target.value })}
                      maxLength={30}
                      aria-label={texts.corporate.nametag}
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-auto rounded-full"
                    disabled={changeNametag.isPending || !nametagMudou}
                    onClick={() => changeNametag.mutate()}
                  >
                    {texts.corporate.nametagChange}
                  </Button>
                </div>

                <p className="text-xs text-text-subtle">{texts.corporate.nametagHint}</p>

                {nametagValido ? (
                  <p className="text-xs text-text-subtle">
                    <code>{nametagPath(nametagDigitado)}</code>
                  </p>
                ) : (
                  <p className="text-xs text-text-subtle">{texts.corporate.nametagInvalid}</p>
                )}

                {nametagMudou && (
                  <p className="text-xs text-text-subtle">{texts.corporate.nametagWarning}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{texts.corporate.headline}</label>

                <Input
                  aria-label={texts.corporate.headline}
                  className={FIELD_CLASS}
                  value={form.headline}
                  onChange={(event) => setForm({ ...form, headline: event.target.value })}
                  maxLength={200}
                />

                <p className="text-xs text-text-subtle">{texts.corporate.activateHint}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{texts.corporate.bio}</label>

                <Textarea
                  aria-label={texts.corporate.bio}
                  className={FIELD_CLASS}
                  rows={4}
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  maxLength={2000}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {texts.corporate.bannerHtml}
                </label>

                <Textarea
                  aria-label={texts.corporate.bannerHtml}
                  className={`${FIELD_CLASS} font-mono text-xs`}
                  rows={6}
                  value={form.bannerHtml}
                  onChange={(event) => setForm({ ...form, bannerHtml: event.target.value })}
                  maxLength={20000}
                  placeholder={texts.corporate.bannerHtmlPlaceholder}
                />

                <p className="text-xs text-text-subtle">{texts.corporate.bannerHtmlHint}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    {texts.corporate.location}
                  </label>

                  <Input
                    aria-label={texts.corporate.location}
                    className={FIELD_CLASS}
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    maxLength={200}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    {texts.corporate.industry}
                  </label>

                  <Input
                    aria-label={texts.corporate.industry}
                    className={FIELD_CLASS}
                    value={form.industry}
                    onChange={(event) => setForm({ ...form, industry: event.target.value })}
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {texts.corporate.externalLinks}
                </label>

                <Input
                  aria-label={texts.corporate.externalLinks}
                  className={FIELD_CLASS}
                  value={form.externalLinks}
                  onChange={(event) => setForm({ ...form, externalLinks: event.target.value })}
                  maxLength={1000}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="w-auto rounded-full"
                  disabled={save.isPending || !form.name.trim()}
                  onClick={() => save.mutate()}
                >
                  {texts.corporate.save}
                </Button>

                {profile.status === "ACTIVE" ? (
                  <Button
                    variant="outline"
                    className="w-auto rounded-full"
                    disabled={deactivate.isPending}
                    onClick={() => deactivate.mutate()}
                  >
                    {texts.corporate.deactivate}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-auto rounded-full"
                    disabled={activate.isPending}
                    onClick={() => activate.mutate()}
                  >
                    {texts.corporate.activate}
                  </Button>
                )}
              </div>
            </div>

            <div className="surface-card space-y-3 p-4 sm:p-6">
              <h2 className="text-lg font-semibold">{texts.corporate.importTitle}</h2>

              <p className="text-sm text-muted-foreground">{texts.corporate.importBody}</p>

              {!importOpen ? (
                <Button
                  variant="outline"
                  className="w-auto rounded-full"
                  onClick={() => setImportOpen(true)}
                >
                  {texts.corporate.importTitle}
                </Button>
              ) : importable.length === 0 ? (
                <p className="text-sm text-text-subtle">{texts.corporate.importEmpty}</p>
              ) : (
                <div className="space-y-3">
                  {importable.map(([field, value]) => (
                    <label
                      key={field}
                      className="flex items-start gap-3 rounded-xl bg-surface-1 p-3"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={Boolean(chosen[field])}
                        onChange={(event) =>
                          setChosen((current) => ({ ...current, [field]: event.target.checked }))
                        }
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-text-strong">
                          {texts.corporate.importField[
                            field as keyof typeof texts.corporate.importField
                          ] ?? field}
                        </span>

                        <span className="block truncate text-xs text-text-subtle">{value}</span>
                      </span>
                    </label>
                  ))}

                  <Button
                    className="w-auto rounded-full"
                    disabled={importFields.isPending || !Object.values(chosen).some(Boolean)}
                    onClick={() => importFields.mutate()}
                  >
                    {texts.corporate.importConfirm}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppContainer>
  );
}
