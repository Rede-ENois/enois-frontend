import { type ChangeEvent, useCallback, useRef, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";

import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import type { UpdateProfileRequest } from "@/types/application/profile/update-profile-request";
import type { ProfileCropPurpose } from "@/types/routes/profile/profile-crop-purpose";
import type { RecommendationItemProps } from "@/types/routes/profile/recommendation-item-props";
import type { SectionProps } from "@/types/routes/profile/section-props";
import {
  ContributorTag,
  PostCardSkeletons,
  ProfileCard,
  StyledName,
  UserAvatar,
} from "@rede-enois/design-system/domain";
import { ImageCropDialog, InfiniteScroll } from "@rede-enois/design-system/patterns";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import {
  Briefcase,
  Camera,
  Clock,
  Flag,
  Gamepad2,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Palette,
  Settings,
  ShieldCheck,
  ShieldOff,
  Star,
  Target,
  ThumbsUp,
  Trophy,
  VolumeX,
} from "lucide-react";

import {
  ApiError,
  contributorSealsApi,
  feedApi,
  gamesApi,
  messagesApi,
  networkApi,
  profileApi,
  rankingApi,
  recommendationsApi,
} from "@/lib/api";
import { authApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { conversationErrorMessage } from "@/lib/conversation-error";
import { profileCardData } from "@/lib/cosmetics";
import { buildShareTags } from "@/lib/open-graph";
import { authorNameStyle } from "@/lib/profile-name-style";
import { isApprovedSoundCloudEmbed } from "@/lib/soundcloud-embed";
import { useAuth } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { AppContainer } from "@/components/app-container";
import { AppearanceDialog } from "@/components/appearance/appearance-dialog";
import { BlockUserDialog } from "@/components/block-user-dialog";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { SaciSpot } from "@/components/events/saci-spot";
import { PostCard } from "@/components/post-card";
import { ReportDialog } from "@/components/post/report-dialog";
import { RichText } from "@/components/post/rich-text";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";
import { ProfileBannerDialog } from "@/components/profile-banner-dialog";
import { ProfileBioDialog } from "@/components/profile-bio-dialog";
import { ProfileResumeDialog } from "@/components/profile-resume-dialog";
import { ProfileSeals } from "@/components/profile-seals";
import { ProfileExperiencesSection } from "@/components/profile/experiences-section";
import { ProfileCommunityShelf } from "@/components/profile/profile-community-shelf";
import { ProfileExplorePanel } from "@/components/profile/profile-explore-panel";
import { ProfileGamificationPanel } from "@/components/profile/profile-gamification-panel";
import { ProfileNetworkDialog } from "@/components/profile/profile-network-dialog";
import { ProfilePeek } from "@/components/profile/profile-peek";
import { ProfileQuickComposer } from "@/components/profile/profile-quick-composer";
import { ProfileStatusDialog } from "@/components/profile/profile-status-dialog";
import { ProfileProjectsSection } from "@/components/profile/projects-section";
import { VerifiedContributorPrompt } from "@/components/verified-contributor-prompt";

/** Paginas de "Publicacoes recentes": o mesmo tamanho do feed, para nao sobrecarregar o perfil. */
const USER_POSTS_PAGE_SIZE = 10;

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
      meta: buildShareTags({
        title,
        description: user?.headline || texts.profile.seoFallbackDescription,
        url: `${texts.siteUrl}/perfil/${encodeURIComponent(params.username)}`,
        imageUrl:
          resolveCdnUrl(user?.banner || user?.avatar) || `${texts.siteUrl}/icons/icon-512.png`,
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

/** "chegou hoje" / "há 3 dias" a partir da data de entrada (nulo quando não há data). */
function joinedLabel(joinedAt: string | null): string | null {
  if (!joinedAt) return null;
  const ms = Date.parse(joinedAt);
  if (Number.isNaN(ms)) return null;
  const days = Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
  return days === 0 ? texts.profile.joinedToday : texts.profile.joinedDaysAgo(days);
}

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
  const [reportOpen, setReportOpen] = useState(false);
  const [recommendComment, setRecommendComment] = useState("");
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  // A capa tem duas formas (foto ou HTML/CSS): o dialogo escolhe, e o clique na capa abre ele.
  const [bannerOpen, setBannerOpen] = useState(false);
  const [networkDialogKind, setNetworkDialogKind] = useState<"connections" | "followers" | null>(
    null,
  );

  const { data: liveProfile } = useQuery({
    queryKey: ["profile", loaderUser.username],
    queryFn: () => profileApi.get(loaderUser.username),
    initialData: loaderUser,
  });

  const user = liveProfile ?? loaderUser;
  const isOwnProfile = me?.id === user.id;

  const { data: contributorSeals } = useQuery({
    queryKey: ["contributor-seals", user.username],
    queryFn: () => contributorSealsApi.byUsername(user.username),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const isContributor = (contributorSeals?.length ?? 0) > 0;

  // A preferência local do nome (deste dispositivo) vale primeiro no próprio perfil.
  const localNameFont = usePreferencesStore((state) => state.displayNameFont);
  const localNameColor = usePreferencesStore((state) => state.displayNameColor);
  const localNameTheme = usePreferencesStore((state) => state.displayNameTheme);
  const renderedNameStyle = isOwnProfile
    ? {
        theme: localNameTheme ?? user.nameTheme,
        font: localNameFont ?? user.nameFont,
        color: localNameColor ?? user.nameColor,
        // The plate is not a device preference: it is always the equipped one.
        nameplate: user.nameplate,
      }
    : authorNameStyle(user);

  // Selo "Dev de jogos" (G2 do plano dos games): só aparece quando a pessoa TEM presença de dev
  // de verdade — jogo publicado ou página de criador preenchida. O DONO da conta recebe 200 do
  // backend mesmo sem nada (é a mesma rota que alimenta o painel para montar a página), então a
  // resposta sozinha não basta: sem conteúdo, o chip não existe nem no próprio perfil.
  const { data: gamesDev } = useQuery({
    queryKey: ["games", "developer", user.username],
    queryFn: () => gamesApi.developer(user.username),
    retry: false,
    staleTime: 300_000,
  });
  const temPaginaDeDev = Boolean(
    gamesDev &&
    (gamesDev.games.length > 0 ||
      gamesDev.displayName ||
      gamesDev.headline ||
      gamesDev.bio ||
      gamesDev.links.length > 0),
  );

  // O currículo só existe na projeção do DONO (/me): o perfil público não traz, de propósito.
  const { data: myProfile } = useQuery({
    queryKey: ["me"],
    queryFn: () => profileApi.me(),
    enabled: isOwnProfile,
    staleTime: 60_000,
  });

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
  const muted = connectionData?.muted ?? false;

  const updateProfile = useMutation({
    mutationFn: (data: Pick<UpdateProfileRequest, "avatar" | "banner">) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
    },
  });

  // Paginado por cursor: a listagem simples devolvia só a primeira pagina, e o post antigo
  // ficava inalcancavel no proprio perfil — quem procurava algo de meses atras nao encontrava.
  const {
    data: feedData,
    hasNextPage: hasMoreUserPosts,
    isFetchingNextPage: isLoadingMoreUserPosts,
    fetchNextPage: fetchMoreUserPosts,
    isLoading: userPostsLoading,
  } = useInfiniteQuery({
    queryKey: ["feed", "user", user.id],
    queryFn: ({ pageParam }) => feedApi.listByUserId(user.id, pageParam, USER_POSTS_PAGE_SIZE),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const userPosts = feedData?.pages.flatMap((page) => page.items) ?? [];

  // O card mostrava o tamanho da pagina carregada, entao congelava em 10 para quem tem mais posts
  // que isso. postsCount e o inteiro do backend; o fallback so vale numa leitura sem contagem.
  const postsCount = user.postsCount ?? userPosts.length;

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

  // Desconectar/cancelar sem precisar BLOQUEAR: bloquear é definitivo e esconde a pessoa de
  // todo o app; para só desfazer a conexão este endpoint deixa o caminho aberto para reconectar.
  const disconnect = useMutation({
    mutationFn: () => networkApi.remove(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
      queryClient.invalidateQueries({ queryKey: ["network"] });
    },
  });

  const toggleMute = useMutation({
    mutationFn: () => (muted ? networkApi.unmute(user.id) : networkApi.mute(user.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
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
    onError: (err) => toast(conversationErrorMessage(err), "error"),
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
      <div className="space-y-5 sm:space-y-6">
        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerUpload}
        />
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        <h1 className="sr-only">{user.name}</h1>

        <ProfileCard
          profile={{ ...profileCardData(user, renderedNameStyle), bio: null }}
          bannerSlot={
            user.bannerHtml ? (
              // Só o embed oficial recebe scripts; HTML arbitrário continua no sandbox sem scripts.
              <SandboxedHtmlFrame
                html={user.bannerHtml}
                title={texts.profile.bannerHtml.frameTitle}
                className="h-full w-full rounded-none border-0 shadow-none"
                autoHeight={false}
                allowSoundCloudPlayer={isApprovedSoundCloudEmbed(user.bannerHtml)}
              />
            ) : undefined
          }
          nameAddon={
            <>
              {/* Vulgo: etiqueta ao lado do nome, escolhida pela própria pessoa. */}
              {user.aka && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-normal text-text-subtle">
                  {texts.profile.aka(user.aka)}
                </span>
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
              {temPaginaDeDev && (
                <Link
                  to="/games/$username"
                  params={{ username: user.username }}
                  className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-normal text-primary hover:underline"
                >
                  <Gamepad2 className="h-3 w-3" />

                  <>{texts.games.developer.devChip}</>
                </Link>
              )}
            </>
          }
          bio={
            <div className="space-y-3">
              {isContributor && <ContributorTag color={user.contributorTagColor} />}

              {user.headline && (
                <p className="break-words text-sm font-normal text-primary">{user.headline}</p>
              )}

              <p className="flex flex-wrap items-center gap-4 text-sm font-normal text-text-subtle">
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
                <span>{texts.profile.connectionsMeta(user.connectionsCount ?? 0)}</span>
                {(user.reputation ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-opportunity/15 px-2 py-0.5 text-xs font-normal text-opportunity-foreground">
                    {texts.profile.reputationMeta(user.reputation ?? 0)}
                  </span>
                )}
              </p>

              <ProfileSeals username={user.username} />

              {isOwnProfile && <VerifiedContributorPrompt />}
            </div>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => avatarRef.current?.click()}
                    disabled={avatarUpload.status === "uploading"}
                  >
                    <Camera className="h-4 w-4" />

                    <>
                      {avatarUpload.status === "uploading"
                        ? texts.common.sending
                        : texts.posts.editPhoto}
                    </>
                  </Button>

                  <EditProfileDialog profile={user}>
                    <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                      <Settings className="h-4 w-4" />

                      <>{texts.profile.editProfile}</>
                    </Button>
                  </EditProfileDialog>

                  {/* UM botão para a capa: o diálogo já oferece as duas formas (foto ou HTML).
                      Havia dois abrindo o mesmo diálogo — um deles com o rótulo antigo. */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => setBannerOpen(true)}
                    disabled={bannerUpload.status === "uploading"}
                  >
                    <ImageIcon className="h-4 w-4" />

                    <>
                      {bannerUpload.status === "uploading"
                        ? texts.common.sending
                        : texts.profile.bannerHtml.action}
                    </>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => setStatusOpen(true)}
                  >
                    <MessageSquareText className="h-4 w-4" />

                    <>{texts.cosmetics.status.action}</>
                  </Button>

                  <ProfileResumeDialog
                    resumeUrl={myProfile?.resumeUrl}
                    resumeName={myProfile?.resumeName}
                    onSaved={() => {
                      queryClient.invalidateQueries({ queryKey: ["me"] });
                    }}
                  />
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

                  {connectionStatus === "ACCEPTED" || connectionStatus === "PENDING" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      disabled={disconnect.isPending}
                      onClick={() => {
                        if (!requireAuth()) return;
                        disconnect.mutate();
                      }}
                    >
                      {connectionStatus === "PENDING"
                        ? texts.profile.cancelRequest
                        : texts.profile.removeConnection}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => {
                        if (!requireAuth()) return;
                        connect.mutate();
                      }}
                      disabled={connect.isPending}
                    >
                      {texts.profile.connect}
                    </Button>
                  )}

                  <BlockUserDialog
                    userId={user.id}
                    name={user.name}
                    blocked={blocked}
                    onDone={() =>
                      queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] })
                    }
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => toggleMute.mutate()}
                    disabled={toggleMute.isPending}
                  >
                    <VolumeX className="h-4 w-4" />

                    <>{muted ? texts.profile.unmute : texts.profile.mute}</>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="h-4 w-4" />

                    <>{texts.posts.report.action}</>
                  </Button>

                  <ReportDialog
                    targetId={user.id}
                    targetType="USER"
                    open={reportOpen}
                    onOpenChange={setReportOpen}
                  />
                </>
              )}

              {blocked && (
                <p className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-normal text-text-subtle">
                  <ShieldOff className="h-4 w-4 shrink-0" />

                  <>{texts.profile.blockedBadge}</>
                </p>
              )}
            </div>
          }
        >
          <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-border-soft bg-surface-1/70 sm:grid-cols-4">
            <a
              href="#atividade"
              className="group border-b border-r border-border-soft px-4 py-3 transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:border-b-0"
            >
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-text-subtle group-hover:text-primary">
                {texts.profile.dashboard.postsLabel}
              </dt>

              <dd className="mt-1 text-xl font-medium tracking-tight text-text-strong">
                {postsCount}
              </dd>
            </a>

            <button
              type="button"
              onClick={() => setNetworkDialogKind("connections")}
              className="group border-b border-border-soft px-4 py-3 text-left transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:border-b-0 sm:border-r"
            >
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-text-subtle group-hover:text-primary">
                {texts.profile.dashboard.connectionsLabel}
              </dt>

              <dd className="mt-1 text-xl font-medium tracking-tight text-text-strong">
                {user.connectionsCount ?? 0}
              </dd>
            </button>

            <button
              type="button"
              onClick={() => setNetworkDialogKind("followers")}
              className="group border-b border-r border-border-soft px-4 py-3 text-left transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:border-b-0"
            >
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-text-subtle group-hover:text-primary">
                {texts.profile.dashboard.followersLabel}
              </dt>

              <dd className="mt-1 text-xl font-medium tracking-tight text-text-strong">
                {user.followersCount ?? 0}
              </dd>
            </button>

            <div className="px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-text-subtle">
                {texts.profile.dashboard.reputationLabel}
              </dt>

              <dd className="mt-1 text-xl font-medium tracking-tight text-primary">
                {user.reputation ?? 0}
              </dd>
            </div>
          </dl>

          <nav
            aria-label={texts.profile.dashboard.progressTitle}
            className="mt-4 flex snap-x gap-2 overflow-x-auto border-t border-border-soft pt-4 scrollbar-hide"
          >
            {[
              texts.profile.sections.about,
              texts.profile.projects.title,
              texts.profile.sections.recentPosts,
            ].map((label, index) => (
              <a
                key={label}
                href={index === 0 ? "#sobre" : index === 1 ? "#projetos" : "#atividade"}
                className="shrink-0 snap-start rounded-full border border-border-soft bg-surface-1 px-4 py-2 text-xs font-medium text-text-subtle transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                {label}
              </a>
            ))}

            <SaciSpot spot="perfil" className="ml-auto shrink-0" />
          </nav>
        </ProfileCard>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-6">
          <div className="space-y-6">
            {isOwnProfile && <ProfileQuickComposer profile={user} />}

            {user.bioHtml ? (
              /* Bio em HTML: card próprio, com o título "Sobre" só na linha de cima e o quadro
                 abaixo encostando nas três bordas. Antes usava o `Section` (que tem padding em
                 volta) com o quadro de celular centralizado — a sobra em volta e a moldura clara
                 do iframe eram o que parecia "borda branca". */
              <section
                id="sobre"
                className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card shadow-[0_18px_50px_-42px_color-mix(in_oklab,var(--primary)_80%,transparent)]"
              >
                {/* Sem canto no card: a bio em HTML vai até as bordas (o raio do card recortava os
                    cantos dela — era o que sobrava de arredondamento). */}

                <h2 className="px-4 pb-3 pt-4 text-base font-normal text-text-strong sm:px-6 sm:pt-6">
                  <>{texts.profile.sections.about}</>
                </h2>

                {/* Sem borda, sem cantos e sem folga interna do quadro: o card dá o acabamento e o
                    HTML do autor usa todo o resto do espaço. O quadro cresce com o conteúdo, mas
                    com TETO: uma bio gigante — ou um `100vh` colado por engano — para de crescer
                    aqui em vez de empurrar a página inteira para baixo. */}
                <SandboxedHtmlFrame
                  html={user.bioHtml}
                  title={texts.profile.bioHtml.frameTitle}
                  className="h-[520px] w-full rounded-none border-0 bg-transparent shadow-none"
                  innerPadding={false}
                  maxHeight={1200}
                />
              </section>
            ) : (
              user.bio && (
                <Section id="sobre" title={texts.profile.sections.about}>
                  <RichText
                    content={user.bio}
                    className="break-words text-sm font-normal leading-relaxed text-text-subtle"
                  />
                </Section>
              )
            )}

            {/* Projetos: cards abaixo da bio — estruturados (stack, repo, status, diário)
                ou o HTML próprio do autor. O dono gerencia por aqui mesmo. */}
            <div id="projetos">
              <ProfileProjectsSection username={user.username} isOwner={isOwnProfile} />
            </div>

            {/* Trajetória profissional logo abaixo dos projetos: cargo, empresa, período
                (com "atual") e descrição, como no LinkedIn. */}
            <ProfileExperiencesSection username={user.username} />

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

            <Section id="atividade" title={texts.profile.sections.recentPosts}>
              {userPostsLoading && <PostCardSkeletons count={2} />}

              {!userPostsLoading && userPosts.length === 0 && (
                <p className="text-sm font-normal text-text-subtle">{texts.profile.noPosts}</p>
              )}

              {!userPostsLoading && userPosts.length > 0 && (
                <div className="space-y-4">
                  {userPosts.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}

                  <InfiniteScroll
                    hasMore={Boolean(hasMoreUserPosts)}
                    loading={isLoadingMoreUserPosts}
                    onLoadMore={() => void fetchMoreUserPosts()}
                    loadingLabel={texts.feed.loadingMore}
                  />
                </div>
              )}
            </Section>
          </div>

          <aside className="self-start space-y-5">
            <ProfileGamificationPanel
              profile={user}
              isOwner={isOwnProfile}
              postsCount={postsCount}
            />
            <ProfileCommunityShelf isOwner={isOwnProfile} />

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

            {/* A seção é OPCIONAL (pedido via suporte): quem desligou nas configurações não vê —
                a preferência é de quem LÊ, não do perfil visitado. Desde 2026-10-20 a lista é de
                CHEGADA (mais recentes primeiro), e o texto acima da lista diz isso. */}
            {me?.showRanking !== false && rankingData && rankingData.length > 0 && (
              <Section title={texts.profile.sections.ranking} icon={Trophy}>
                <p className="-mt-1 mb-2 text-xs font-normal text-text-subtle">
                  {texts.profile.newMembersHint}
                </p>

                <div className="space-y-2">
                  {rankingData.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <ProfilePeek username={u.username} name={u.name} className="shrink-0">
                        <UserAvatar src={u.avatar} alt={u.name} className="h-8 w-8 shrink-0" />
                      </ProfilePeek>

                      <div className="min-w-0 flex-1">
                        <ProfilePeek
                          username={u.username}
                          name={u.name}
                          className="block max-w-full truncate text-sm font-normal text-text-strong hover:underline"
                        >
                          <StyledName name={u.name} style={authorNameStyle(u)} />
                        </ProfilePeek>
                      </div>

                      {/* A coluna da direita é QUANDO chegou (o número de reputação não descreve
                          mais esta lista). */}
                      {joinedLabel(u.joinedAt) && (
                        <span className="shrink-0 text-xs font-normal text-text-subtle">
                          {joinedLabel(u.joinedAt)}
                        </span>
                      )}
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

            <ProfileExplorePanel />
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
      <AppearanceDialog
        open={appearanceOpen}
        onOpenChange={setAppearanceOpen}
        profileName={user.name}
        profileNameFont={user.nameFont ?? undefined}
        profileNameColor={user.nameColor}
        profileNameTheme={user.nameTheme ?? undefined}
        contributor={isOwnProfile && isContributor}
        contributorTagColor={user.contributorTagColor ?? null}
      />
      {isOwnProfile && (
        <ProfileStatusDialog
          open={statusOpen}
          onOpenChange={setStatusOpen}
          username={user.username}
          statusText={user.statusText}
          statusIcon={user.statusIcon}
        />
      )}
      <ProfileNetworkDialog
        username={user.username}
        name={user.name}
        kind={networkDialogKind ?? "connections"}
        open={networkDialogKind !== null}
        onOpenChange={(open) => {
          if (!open) setNetworkDialogKind(null);
        }}
      />
    </AppContainer>
  );
}

function Section({ title, icon: Icon, children, id }: SectionProps & { id?: string }) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-border-soft bg-surface-card p-4 shadow-[0_18px_50px_-44px_color-mix(in_oklab,var(--primary)_85%,transparent)] sm:p-6"
    >
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
      <ProfilePeek
        userId={recommendation.recommenderId}
        name={recommender?.name ?? texts.profile.userFallback}
        className="mb-2 flex items-center gap-2"
      >
        <UserAvatar
          frame={recommender?.avatarFrame}
          src={recommender?.avatar}
          alt={recommender?.name}
          className="h-6 w-6"
        />

        <span className="text-xs font-medium text-text-strong">
          {recommender?.name ?? texts.profile.userFallback}
        </span>
      </ProfilePeek>

      <p className="break-words text-sm font-normal leading-relaxed text-text-subtle">
        {texts.profile.recommendationQuote(recommendation.comment)}
      </p>
    </div>
  );
}
