import { type ChangeEvent, useCallback, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { UpdateProfileRequest } from "@/types/application/profile/update-profile-request";
import type { ProfileCropPurpose } from "@/types/routes/profile/profile-crop-purpose";
import type { RecommendationItemProps } from "@/types/routes/profile/recommendation-item-props";
import type { SectionProps } from "@/types/routes/profile/section-props";
import {
  Briefcase,
  Camera,
  Clock,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Palette,
  Settings,
  ShieldCheck,
  ShieldOff,
  Star,
  Target,
  ThumbsUp,
  Trophy,
} from "lucide-react";

import {
  ApiError,
  feedApi,
  messagesApi,
  networkApi,
  profileApi,
  rankingApi,
  recommendationsApi,
} from "@/lib/api";
import { authApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { buildPageShareTags } from "@/lib/open-graph";
import { useAuth } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";
import { AppearanceDialog } from "@/components/appearance/appearance-dialog";
import { BlockUserDialog } from "@/components/block-user-dialog";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { PostCard } from "@/components/post-card";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";
import { ProfileBannerDialog } from "@/components/profile-banner-dialog";
import { ProfileBioDialog } from "@/components/profile-bio-dialog";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/perfil/$username")({
  loader: async ({ params }) => {
    try {
      const user = await profileApi.get(params.username);
      return { user };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData, params }) => {
    const user = loaderData?.user;
    const title = texts.profile.seoTitle(user?.name ?? texts.profile.seoFallbackTitle);
    return {
      meta: buildPageShareTags({
        title,
        description: user?.headline || texts.profile.seoFallbackDescription,
        path: `/perfil/${encodeURIComponent(params.username)}`,
        imageUrl: resolveCdnUrl(user?.banner || user?.avatar),
        imageAlt: user?.name ? `Perfil de ${user.name} no Énóis` : title,
      }),
    };
  },
  notFoundComponent: () => (
    <AppContainer>
      <div className="rounded-2xl border border-border-soft bg-surface-card p-10 text-center">
        <p className="text-base font-normal text-text-strong">{texts.profile.notFound}</p>

        <Link to="/" className="mt-2 inline-block text-sm font-normal text-primary hover:underline">
          {texts.profile.backHome}
        </Link>
      </div>
    </AppContainer>
  ),
  errorComponent: () => (
    <AppContainer>
      <div className="rounded-2xl border border-border-soft bg-surface-card p-10 text-center">
        <p className="text-sm font-normal text-text-subtle">{texts.profile.loadError}</p>
      </div>
    </AppContainer>
  ),
  component: Profile,
});

function Profile() {
  const { user: loaderUser } = Route.useLoaderData();
  const { user: me, requireAuth } = useAuth();

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const avatarUpload = useMediaUpload();
  const bannerUpload = useMediaUpload();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPurpose, setCropPurpose] = useState<ProfileCropPurpose | null>(null);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendComment, setRecommendComment] = useState("");
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  // A capa tem duas formas (foto ou HTML/CSS): o dialogo escolhe, e o clique na capa abre ele.
  const [bannerOpen, setBannerOpen] = useState(false);

  const { data: liveProfile } = useQuery({
    queryKey: ["profile", loaderUser.username],
    queryFn: () => profileApi.get(loaderUser.username),
    initialData: loaderUser,
  });

  const user = liveProfile ?? loaderUser;
  const isOwnProfile = me?.id === user.id;

  // Estado de verificação da conta (e-mail/2FA): vem de /auth/me, não do perfil público.
  const { data: authMe } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
    enabled: isOwnProfile,
    staleTime: 60_000,
  });

  const { data: connectionData } = useQuery({
    queryKey: ["connection-status", user.id],
    queryFn: () => networkApi.status(user.id),
    enabled: !isOwnProfile && !!me,
  });

  const connectionStatus = connectionData?.status ?? null;
  const blocked = connectionData?.blocked ?? false;

  const updateProfile = useMutation({
    mutationFn: (data: Pick<UpdateProfileRequest, "avatar" | "banner">) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
    },
  });

  const { data: feedData } = useQuery({
    queryKey: ["feed", "user", user.id],
    queryFn: () => feedApi.listByUserId(user.id),
  });

  const userPosts = feedData?.items ?? [];

  const { data: rankingData } = useQuery({
    queryKey: ["ranking"],
    queryFn: () => rankingApi.list(10),
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ["recommendations", user.id],
    queryFn: () => recommendationsApi.listReceived(user.id),
  });

  const connect = useMutation({
    mutationFn: () => networkApi.connect(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.code === "CONNECTION_ALREADY_REQUESTED") {
        queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
      }
    },
  });

  // Abrir conversa: reaproveita a conversa direta existente (o backend nao duplica) e ja entra
  // nela. Antes o botao so levava para a lista de mensagens, deixando a pessoa procurar o contato.
  const openConversation = useMutation({
    mutationFn: () => messagesApi.openDirect(user.id),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/mensagens", search: { conversation: conversation.id } });
    },
  });

  const handleMessage = () => {
    if (!requireAuth()) return;
    openConversation.mutate();
  };

  const recommend = useMutation({
    mutationFn: () => recommendationsApi.create(user.id, { comment: recommendComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });
      setRecommendOpen(false);
      setRecommendComment("");
    },
  });

  // GIF animado nao passa pelo recorte: o canvas converteria o primeiro frame em JPEG
  // e mataria a animacao, entao o arquivo original vai direto pro upload.
  const handleGifUpload = async (file: File, purpose: "AVATAR" | "BANNER") => {
    try {
      const upload = purpose === "AVATAR" ? avatarUpload : bannerUpload;
      const result = await upload.upload(file, purpose);
      const field = purpose === "AVATAR" ? "avatar" : "banner";
      await updateProfile.mutateAsync({ [field]: result.cdnUrl });
    } catch {
      toast(texts.profile.imageUploadError, "error");
    }
  };

  // Limpar o input e essencial: o navegador nao dispara `change` quando o usuario escolhe o MESMO
  // arquivo duas vezes, e a impressao que fica e "a imagem nao carrega".
  const openCrop = (input: HTMLInputElement, purpose: "AVATAR" | "BANNER") => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
    if (isGif) {
      void handleGifUpload(file, purpose);
      return;
    }
    setCropImageSrc(URL.createObjectURL(file));
    setCropPurpose(purpose);
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    openCrop(event.target, "AVATAR");
  };

  const handleBannerUpload = (event: ChangeEvent<HTMLInputElement>) => {
    openCrop(event.target, "BANNER");
  };

  const handleCropComplete = useCallback(
    async (blob: Blob) => {
      const upload = cropPurpose === "AVATAR" ? avatarUpload : bannerUpload;
      const result = await upload.upload(
        new File([blob], "crop.jpg", { type: "image/jpeg" }),
        cropPurpose!,
      );
      const field = cropPurpose === "AVATAR" ? "avatar" : "banner";
      await updateProfile.mutateAsync({ [field]: result.cdnUrl });
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
      setCropPurpose(null);
    },
    [cropPurpose, cropImageSrc, avatarUpload, bannerUpload, updateProfile],
  );

  const handleCropCancel = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-soft bg-surface-card overflow-hidden">
          <div className="group relative">
            {user.bannerHtml ? (
              // Capa em HTML/CSS: mesmo espaço da foto (mesmas classes), sem moldura própria — quem
              // recorta é o card, e o quadro já vem com sandbox sem scripts.
              <SandboxedHtmlFrame
                html={user.bannerHtml}
                title={texts.profile.bannerHtml.frameTitle}
                className="h-40 w-full rounded-none border-0 shadow-none sm:h-52"
              />
            ) : user.banner ? (
              <img
                src={resolveCdnUrl(user.banner)}
                alt=""
                className="h-40 w-full object-cover sm:h-52"
              />
            ) : (
              <div
                className="h-40 w-full sm:h-52"
                style={{ background: "var(--gradient-primary)" }}
              />
            )}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setBannerOpen(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition md:opacity-0 md:group-hover:opacity-100"
                disabled={bannerUpload.status === "uploading"}
              >
                {bannerUpload.status === "uploading" ? (
                  texts.common.sending
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </button>
            )}
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
          </div>

          <div className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14 sm:gap-4">
              <div className="group relative">
                <UserAvatar
                  src={resolveCdnUrl(user.avatar)}
                  alt={user.name}
                  className="h-24 w-24 ring-4 ring-surface-card sm:h-28 sm:w-28"
                />
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => avatarRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white transition md:opacity-0 md:group-hover:opacity-100"
                    disabled={avatarUpload.status === "uploading"}
                  >
                    {avatarUpload.status === "uploading" ? (
                      texts.profile.uploadingIndicator
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </button>
                )}
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {isOwnProfile ? (
                  <>
                    <EditProfileDialog profile={user}>
                      <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                        <Settings className="h-4 w-4" />

                        <>{texts.profile.editProfile}</>
                      </Button>
                    </EditProfileDialog>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => setBannerOpen(true)}
                    >
                      <Palette className="h-4 w-4" />

                      <>{texts.profile.bannerHtml.action}</>
                    </Button>

                    <ProfileBioDialog
                      initialHtml={user.bioHtml ?? null}
                      onSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ["me"] });
                        queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
                        queryClient.invalidateQueries({ queryKey: ["auth-me"] });
                      }}
                    />

                    {/* Personalização do tema: fica no próprio perfil, que é onde a pessoa
                        cuida da conta. As cores valem só neste dispositivo. */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => setAppearanceOpen(true)}
                    >
                      <Palette className="h-4 w-4" />

                      <>{texts.appearance.action}</>
                    </Button>

                    {/* Sem identidade verificada a reputação é multiplicada por zero: o caminho para
                        resolver (confirmar e-mail ou ligar o 2FA) fica aqui, no próprio perfil. */}
                    {authMe && !authMe.identityVerified && (
                      <Link to="/seguranca">
                        <Button size="sm" className="rounded-full gap-1.5">
                          <ShieldCheck className="h-4 w-4" />

                          <>{texts.auth.twoFactor.verifyIdentity}</>
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={handleMessage}
                      disabled={openConversation.isPending}
                    >
                      <MessageCircle className="h-4 w-4" />

                      <>{texts.profile.message}</>
                    </Button>

                    <Button
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => {
                        if (!requireAuth()) return;
                        connect.mutate();
                      }}
                      disabled={
                        connect.isPending ||
                        connectionStatus === "ACCEPTED" ||
                        connectionStatus === "PENDING"
                      }
                    >
                      {connectionStatus === "PENDING"
                        ? texts.profile.waitingResponse
                        : connectionStatus === "ACCEPTED"
                          ? texts.profile.connected
                          : texts.profile.connect}
                    </Button>

                    <BlockUserDialog
                      userId={user.id}
                      name={user.name}
                      blocked={blocked}
                      onDone={() =>
                        queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] })
                      }
                    />
                  </>
                )}
              </div>

              {blocked && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-normal text-text-subtle">
                  <ShieldOff className="h-4 w-4 shrink-0" />

                  <>{texts.profile.blockedBadge}</>
                </p>
              )}
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-xl font-normal tracking-tight text-text-strong">
                  {user.name}
                </h1>

                {/* Emblemas: até 5, PNG pequeno colado ao nome — fora do <h1> para não entrar no
                    texto do título. Quem escolhe é a própria pessoa, nas configurações. */}
                {(user.badges?.length ? user.badges : user.badge ? [user.badge] : []).map(
                  (badge) => (
                    <img
                      key={badge}
                      src={resolveCdnUrl(badge)}
                      alt=""
                      className="h-4 w-4 shrink-0 rounded-full object-cover"
                    />
                  ),
                )}

                {user.openToWork && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-normal text-growth">
                    {texts.profile.openToWork}
                  </span>
                )}
                {user.isMentor && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-normal text-primary">
                    {texts.profile.mentorAvailable}
                  </span>
                )}
              </div>

              <p className="mt-1 break-words text-sm font-normal text-primary">{user.headline}</p>

              <p className="mt-3 flex flex-wrap items-center gap-4 text-sm font-normal text-text-subtle">
                {user.company && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />

                    <>{user.company}</>
                  </span>
                )}
                {user.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />

                    <>{user.location}</>
                  </span>
                )}
                <span>{texts.profile.connectionsMeta(user.connectionsCount)}</span>
                {(user.reputation ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-opportunity/15 px-2 py-0.5 text-xs font-normal text-opportunity-foreground">
                    {texts.profile.reputationMeta(user.reputation ?? 0)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {user.bioHtml ? (
              /* Bio em HTML: card próprio, com o título "Sobre" só na linha de cima e o quadro
                 abaixo encostando nas três bordas. Antes usava o `Section` (que tem padding em
                 volta) com o quadro de celular centralizado — a sobra em volta e a moldura clara
                 do iframe eram o que parecia "borda branca". */
              <section className="border border-border-soft bg-surface-card">
                {/* Sem canto no card: a bio em HTML vai até as bordas (o raio do card recortava os
                    cantos dela — era o que sobrava de arredondamento). */}

                <h2 className="px-4 pb-3 pt-4 text-base font-normal text-text-strong sm:px-6 sm:pt-6">
                  <>{texts.profile.sections.about}</>
                </h2>

                {/* Sem borda, sem cantos e sem folga interna do quadro: o card dá o acabamento e o
                    HTML do autor usa todo o resto do espaço. A altura é fixa porque medir o conteúdo
                    de dentro exigiria script no quadro — e não há script nele. */}
                <SandboxedHtmlFrame
                  html={user.bioHtml}
                  title={texts.profile.bioHtml.frameTitle}
                  className="h-[520px] w-full rounded-none border-0 bg-transparent shadow-none"
                  innerPadding={false}
                />
              </section>
            ) : (
              user.bio && (
                <Section title={texts.profile.sections.about}>
                  <p className="break-words text-sm font-normal leading-relaxed text-text-subtle">
                    {user.bio}
                  </p>
                </Section>
              )
            )}

            {user.skills.length > 0 && (
              <Section title={texts.profile.sections.skills}>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s: string) => (
                    <span
                      key={s}
                      className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-normal text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {user.goals.length > 0 && (
              <Section title={texts.profile.sections.goals} icon={Target}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {user.goals.map((goal: string) => (
                    <div key={goal} className="rounded-xl border border-border-soft p-4">
                      <p className="break-words text-sm font-normal text-text-strong">{goal}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title={texts.profile.sections.recentPosts}>
              {userPosts.length === 0 ? (
                <p className="text-sm font-normal text-text-subtle">{texts.profile.noPosts}</p>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              )}
            </Section>
          </div>

          <aside className="space-y-6">
            <Section title={texts.profile.sections.availability} icon={Clock}>
              <p className="break-words text-sm font-normal leading-relaxed text-text-subtle">
                {user.availability ?? texts.profile.availabilityUnknown}
              </p>
            </Section>

            {!isOwnProfile && (
              <Section title={texts.profile.sections.recommend} icon={ThumbsUp}>
                <p className="mb-3 text-sm font-normal text-text-subtle">
                  {texts.profile.recommendDescription}
                </p>

                <Dialog open={recommendOpen} onOpenChange={setRecommendOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full rounded-full gap-1.5">
                      <ThumbsUp className="h-4 w-4" />

                      <>{texts.profile.recommendAction}</>
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-normal">
                        {texts.profile.recommendTitle(user.name)}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                      <Textarea
                        value={recommendComment}
                        onChange={(e) => setRecommendComment(e.target.value)}
                        placeholder={texts.profile.recommendPlaceholder}
                        rows={3}
                        className="border-border-soft bg-surface-1 text-sm font-normal"
                      />

                      <Button
                        size="sm"
                        className="w-full rounded-full"
                        disabled={!recommendComment.trim() || recommend.isPending}
                        onClick={() => recommend.mutate()}
                      >
                        {recommend.isPending
                          ? texts.common.sending
                          : texts.profile.sendRecommendation}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </Section>
            )}

            {recommendationsData && recommendationsData.length > 0 && (
              <Section title={texts.profile.sections.recommendations} icon={Star}>
                <div className="space-y-3">
                  {recommendationsData.map((rec) => (
                    <RecommendationItem key={rec.id} recommendation={rec} />
                  ))}
                </div>
              </Section>
            )}

            {rankingData && rankingData.length > 0 && (
              <Section title={texts.profile.sections.ranking} icon={Trophy}>
                <div className="space-y-2">
                  {rankingData.slice(0, 5).map((u, i) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <span
                        className={`w-5 text-center text-sm font-normal ${i < 3 ? "text-opportunity" : "text-text-subtle"}`}
                      >
                        {texts.profile.rankingPosition(i + 1)}
                      </span>

                      <Link to="/perfil/$username" params={{ username: u.username }}>
                        <UserAvatar src={u.avatar} alt={u.name} className="h-8 w-8 shrink-0" />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          to="/perfil/$username"
                          params={{ username: u.username }}
                          className="truncate text-sm font-normal text-text-strong hover:underline"
                        >
                          {u.name}
                        </Link>
                      </div>

                      <span className="text-xs font-normal text-opportunity-foreground">
                        {u.reputation}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {user.externalLinks.length > 0 && (
              <Section title={texts.profile.sections.links}>
                <ul className="space-y-2 text-sm font-normal">
                  {user.externalLinks.map((link: string) => (
                    <li key={link} className="flex items-center gap-2 text-text-subtle">
                      <LinkIcon className="h-4 w-4" />

                      <span className="truncate text-text-strong">{link}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </aside>
        </div>
      </div>

      <div className="h-4 lg:hidden" />

      {cropImageSrc && cropPurpose && (
        <ImageCropDialog
          open={!!cropImageSrc}
          onOpenChange={(v) => {
            if (!v) handleCropCancel();
          }}
          imageSrc={cropImageSrc}
          aspect={cropPurpose === "AVATAR" ? 1 : 3}
          title={cropPurpose === "AVATAR" ? texts.profile.cropAvatar : texts.profile.cropCover}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Dialogo da capa: sem ele, clicar na capa (ou em "Mudar capa") so mudava um estado que
          ninguem lia — o clique parecia nao fazer nada. */}
      <ProfileBannerDialog
        open={bannerOpen}
        onOpenChange={setBannerOpen}
        initialHtml={user.bannerHtml ?? null}
        onPickPhoto={() => bannerRef.current?.click()}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["me"] });
          queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
          queryClient.invalidateQueries({ queryKey: ["auth-me"] });
        }}
      />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
    </AppContainer>
  );
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-normal text-text-strong">
        {Icon && (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-2">
            <Icon className="h-4 w-4 text-primary" />
          </span>
        )}
        <>{title}</>
      </h2>
      {children}
    </section>
  );
}

function RecommendationItem({ recommendation }: RecommendationItemProps) {
  const { data: recommender } = useQuery({
    queryKey: ["profile", "by-id", recommendation.recommenderId],
    queryFn: () => profileApi.getById(recommendation.recommenderId),
  });

  return (
    <div className="rounded-xl bg-surface-1 p-3">
      <div className="flex items-center gap-2 mb-2">
        <UserAvatar src={recommender?.avatar} alt={recommender?.name} className="h-6 w-6" />

        <span className="text-xs font-medium text-text-strong">
          {recommender?.name ?? texts.profile.userFallback}
        </span>
      </div>

      <p className="break-words text-sm font-normal leading-relaxed text-text-subtle">
        {texts.profile.recommendationQuote(recommendation.comment)}
      </p>
    </div>
  );
}
