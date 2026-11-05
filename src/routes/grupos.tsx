import { type ChangeEvent, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useMatchRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { GroupView } from "@/types/application/group/group-view";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PageHeader,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import { Camera, ChevronRight, Compass, Loader2, Plus, Search, Users } from "lucide-react";

import { groupsApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/grupos")({
  head: () => ({ meta: [{ title: texts.groups.seoTitle }] }),
  component: Grupos,
});

/**
 * Painel de grupos — mostra primeiro os grupos dos quais o usuário participa,
 * com painel lateral "Descobrir" onde o sistema sugere novos grupos da rede.
 */
function Grupos() {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const authenticated = useIsAuthenticated();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Este arquivo é o PAI de /grupos/$slug: quando um grupo está na URL, quem responde é o filho
  // (a página do grupo) — sem o Outlet, a lista engolia a navegação e ninguém conseguia ENTRAR
  // num grupo: criar navegava para o detalhe e mostrava a lista de novo.
  const matchRoute = useMatchRoute();
  const isDetail = matchRoute({ to: "/grupos/$slug" });

  const {
    data: mineData,
    isLoading: isMineLoading,
    isError: isMineError,
  } = useQuery({
    queryKey: ["groups", "mine"],
    queryFn: () => groupsApi.mine(),
    enabled: !isDetail && authenticated,
  });

  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
  } = useQuery({
    queryKey: ["groups", "list", query],
    queryFn: () => groupsApi.list(query.trim() || undefined),
    enabled: !isDetail,
  });

  const joinMutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.join(groupId),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast(res.status === "MEMBER" ? texts.groups.joined : texts.groups.pending);
    },
    onError: () => toast(texts.groups.joinError, "error"),
  });

  if (isDetail) {
    return <Outlet />;
  }

  const allMine = mineData?.items ?? [];
  const needle = query.trim().toLocaleLowerCase("pt-BR");
  const filteredMine = needle
    ? allMine.filter(
        (g) =>
          g.name.toLocaleLowerCase("pt-BR").includes(needle) ||
          (g.description ?? "").toLocaleLowerCase("pt-BR").includes(needle),
      )
    : allMine;

  const mineIdSet = new Set(allMine.map((g) => g.id));
  const suggestedGroups = (listData?.items ?? []).filter((g) => !g.joined && !mineIdSet.has(g.id));

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <PageHeader
          title={texts.groups.title}
          description={texts.groups.subtitle}
          actions={
            authenticated && (
              <Button className="w-auto rounded-full gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />

                <>{texts.groups.create}</>
              </Button>
            )
          }
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={texts.groups.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={texts.groups.searchPlaceholder}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Coluna Principal: Grupos em que participamos */}
          <section className="min-w-0 space-y-4">
            {authenticated ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-text-strong">
                    {texts.groups.myGroups}
                    {allMine.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-text-subtle">
                        ({allMine.length})
                      </span>
                    )}
                  </h2>
                </div>

                {isMineLoading && (
                  <div className="flex justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}

                {isMineError && (
                  <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {texts.groups.loadError}
                  </p>
                )}

                {!isMineLoading && !isMineError && filteredMine.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border-soft p-8 text-center">
                    <p className="font-medium text-text-strong">
                      {query.trim() ? texts.groups.myGroupsSearchEmpty : texts.groups.myGroupsEmpty}
                    </p>
                    {!query.trim() && (
                      <p className="mt-1 text-sm text-text-subtle">
                        {texts.groups.myGroupsEmptyHint}
                      </p>
                    )}
                  </div>
                )}

                <ul className="space-y-3">
                  {filteredMine.map((group) => (
                    <GroupCard key={group.id} group={group} isMember />
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-text-strong">{texts.groups.title}</h2>

                {isListLoading && (
                  <div className="flex justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}

                {isListError && (
                  <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {texts.groups.loadError}
                  </p>
                )}

                {!isListLoading && !isListError && (listData?.items ?? []).length === 0 && (
                  <p className="text-sm text-text-subtle">{texts.groups.empty}</p>
                )}

                <ul className="space-y-3">
                  {(listData?.items ?? []).map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Painel Lateral: Descobrir novos grupos */}
          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />

                <h2 className="text-sm font-semibold text-text-strong">{texts.groups.discover}</h2>
              </div>

              <p className="mt-1 text-xs text-text-subtle">{texts.groups.discoverSubtitle}</p>

              {isListLoading && (
                <div className="flex justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}

              {isListError && (
                <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {texts.groups.loadError}
                </p>
              )}

              {!isListLoading && !isListError && suggestedGroups.length === 0 && (
                <p className="mt-4 text-xs text-text-subtle">
                  {query.trim() ? texts.groups.discoverSearchEmpty : texts.groups.discoverEmpty}
                </p>
              )}

              {!isListLoading && !isListError && suggestedGroups.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {suggestedGroups.map((group) => (
                    <SuggestedGroupCard
                      key={group.id}
                      group={group}
                      onJoin={(id) => joinMutation.mutate(id)}
                      isJoining={joinMutation.isPending && joinMutation.variables === group.id}
                      authenticated={authenticated}
                    />
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </AppContainer>
  );
}

function GroupCard({ group, isMember }: { group: GroupView; isMember?: boolean }) {
  const roleLabel =
    group.viewerRole === "OWNER"
      ? texts.groups.roleOwner
      : group.viewerRole === "ADMIN"
        ? texts.groups.roleAdmin
        : group.viewerRole === "MODERATOR"
          ? texts.groups.roleModerator
          : isMember || group.joined
            ? texts.groups.roleMember
            : null;

  return (
    <li>
      <Link
        to="/grupos/$slug"
        params={{ slug: group.slug }}
        className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface-card p-4 transition hover:border-primary/40"
      >
        {group.avatar ? (
          <img
            src={resolveCdnUrl(group.avatar)}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Users className="h-5 w-5" />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-semibold text-text-strong">{group.name}</span>
            {roleLabel && (
              <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                {roleLabel}
              </span>
            )}
          </span>

          {group.description && (
            <span className="block truncate text-sm text-text-subtle">{group.description}</span>
          )}

          <span className="mt-0.5 block text-xs text-text-date">
            {texts.groups.members(group.members)} ·{" "}
            {group.joinMode === "OPEN" ? texts.groups.joinModeOpen : texts.groups.joinModeApproval}
          </span>
        </span>

        <ChevronRight className="h-4 w-4 shrink-0 text-text-subtle" />
      </Link>
    </li>
  );
}

function SuggestedGroupCard({
  group,
  onJoin,
  isJoining,
  authenticated,
}: {
  group: GroupView;
  onJoin: (id: string) => void;
  isJoining: boolean;
  authenticated: boolean;
}) {
  const navigate = useNavigate();

  return (
    <li className="rounded-xl border border-border-soft bg-surface-card p-3 transition hover:border-primary/30">
      <div className="flex items-start gap-2.5">
        <Link to="/grupos/$slug" params={{ slug: group.slug }} className="shrink-0">
          {group.avatar ? (
            <img
              src={resolveCdnUrl(group.avatar)}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Users className="h-4 w-4" />
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to="/grupos/$slug"
            params={{ slug: group.slug }}
            className="block truncate text-sm font-semibold text-text-strong hover:text-primary transition"
          >
            {group.name}
          </Link>

          <span className="block text-[11px] text-text-date">
            {texts.groups.members(group.members)} ·{" "}
            {group.joinMode === "OPEN" ? texts.groups.joinModeOpen : texts.groups.joinModeApproval}
          </span>
          {group.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-text-subtle">{group.description}</p>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-end">
        {group.requestPending ? (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-subtle">
            {texts.groups.pending}
          </span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-auto rounded-full px-3 text-xs font-medium gap-1"
            disabled={isJoining}
            onClick={() => {
              if (!authenticated) {
                void navigate({ to: "/entrar" });
                return;
              }
              onJoin(group.id);
            }}
          >
            {isJoining ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : group.joinMode === "OPEN" ? (
              texts.groups.join
            ) : (
              texts.groups.requestJoin
            )}
          </Button>
        )}
      </div>
    </li>
  );
}

function CreateGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [joinMode, setJoinMode] = useState<"OPEN" | "APPROVAL">("APPROVAL");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const avatarUpload = useMediaUpload();
  const bannerUpload = useMediaUpload();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File, kind: "avatar" | "banner") => {
    try {
      const result = await (kind === "avatar" ? avatarUpload : bannerUpload).upload(
        file,
        kind === "avatar" ? "AVATAR" : "COVER",
      );
      if (kind === "avatar") setAvatar(result.cdnUrl);
      else setBanner(result.cdnUrl);
    } catch {
      toast(texts.groups.uploadError, "error");
    }
  };

  const chooseFile = (kind: "avatar" | "banner") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploadImage(file, kind);
    event.target.value = "";
  };

  // O hook devolve o estado ESPALHADO ({ status, progress, ... }), não aninhado em `.state`.
  const uploading = avatarUpload.status === "uploading" || bannerUpload.status === "uploading";

  const create = useMutation({
    mutationFn: () =>
      groupsApi.create({
        name: name.trim(),
        description: description.trim() || null,
        joinMode,
        avatar: avatar || null,
        banner: banner || null,
      }),
    onSuccess: (group) => {
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      onOpenChange(false);
      void navigate({ to: "/grupos/$slug", params: { slug: group.slug } });
    },
    onError: () => toast(texts.groups.createError, "error"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.groups.createTitle}</DialogTitle>

          <DialogDescription>{texts.groups.createDescription}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[80vh] space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <Label>{texts.groups.logo}</Label>

            <p className="text-xs font-normal text-text-subtle">{texts.groups.logoHint}</p>

            <div className="flex items-center gap-3">
              {avatar ? (
                <img
                  src={resolveCdnUrl(avatar)}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Users className="h-5 w-5" />
                </span>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-auto rounded-full gap-1.5"
                disabled={uploading}
                onClick={() => avatarRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5" />

                <>{avatar ? texts.groups.changeImage : texts.groups.addLogo}</>
              </Button>
            </div>

            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={chooseFile("avatar")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="groupName">{texts.groups.name}</Label>

            <Input
              id="groupName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={texts.groups.namePlaceholder}
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="groupDescription">{texts.groups.description}</Label>

            <Textarea
              id="groupDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={texts.groups.descriptionPlaceholder}
              maxLength={600}
              className="min-h-20"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-text-strong">{texts.groups.bannerLabel}</p>

            <p className="text-xs font-normal text-text-subtle">{texts.groups.bannerHint}</p>

            {banner ? (
              <div className="group relative overflow-hidden rounded-xl border border-border-soft">
                <img src={resolveCdnUrl(banner)} alt="" className="h-24 w-full object-cover" />

                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 transition md:opacity-0 md:group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-auto rounded-full"
                    disabled={uploading}
                    onClick={() => bannerRef.current?.click()}
                  >
                    {texts.groups.changeImage}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-auto rounded-full"
                    onClick={() => setBanner("")}
                  >
                    {texts.groups.removeImage}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full gap-1.5"
                disabled={uploading}
                onClick={() => bannerRef.current?.click()}
              >
                <Camera className="h-4 w-4" />

                <>{texts.groups.addBanner}</>
              </Button>
            )}

            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={chooseFile("banner")}
            />

            <p className="text-xs font-normal text-text-subtle">{texts.groups.bannerHtmlHint}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-text-strong">{texts.groups.joinModeLabel}</p>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "OPEN" as const, label: texts.groups.openLabel },
                  { id: "APPROVAL" as const, label: texts.groups.approvalLabel },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setJoinMode(option.id)}
                  aria-pressed={joinMode === option.id}
                  className={
                    joinMode === option.id
                      ? "rounded-full border border-primary bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary"
                      : "rounded-full border border-border-soft px-3 py-1.5 text-xs font-normal text-text-subtle transition hover:text-text-strong"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full rounded-full"
            disabled={!name.trim() || create.isPending || uploading}
            onClick={() => create.mutate()}
          >
            {create.isPending ? texts.groups.creating : texts.groups.createAction}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
