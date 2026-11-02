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
import { Camera, ChevronRight, Loader2, Plus, Search, Users } from "lucide-react";

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
 * Descoberta de grupos — PÚBLICA de propósito: quem ainda não entrou pode conhecer a apresentação,
 * mas nada do conteúdo interno aparece aqui (o backend só manda metadados públicos).
 */
function Grupos() {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const authenticated = useIsAuthenticated();

  // Este arquivo é o PAI de /grupos/$slug: quando um grupo está na URL, quem responde é o filho
  // (a página do grupo) — sem o Outlet, a lista engolia a navegação e ninguém conseguia ENTRAR
  // num grupo: criar navegava para o detalhe e mostrava a lista de novo.
  const matchRoute = useMatchRoute();
  const isDetail = matchRoute({ to: "/grupos/$slug" });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["groups", query],
    queryFn: () => groupsApi.list(query.trim() || undefined),
    enabled: !isDetail,
  });
  const groups = data?.items ?? [];

  if (isDetail) {
    return <Outlet />;
  }

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-4xl space-y-6">
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

        {isLoading && (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {isError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {texts.groups.loadError}
          </p>
        )}

        {!isLoading && !isError && groups.length === 0 && (
          <p className="text-sm text-text-subtle">{texts.groups.empty}</p>
        )}

        <ul className="space-y-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </ul>
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </AppContainer>
  );
}

function GroupCard({ group }: { group: GroupView }) {
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
          <span className="block truncate font-semibold text-text-strong">{group.name}</span>

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
