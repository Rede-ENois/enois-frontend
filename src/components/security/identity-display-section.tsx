import { useEffect, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { MAX_BADGES } from "@/constants/badges";
import { texts } from "@/texts";
import { X } from "lucide-react";

import { preferencesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { useCurrentUser } from "@/lib/current-user";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

/**
 * Nome e identidade: nome social (substitui o de cadastro para todo mundo), apelido
 * (entra entre parênteses depois do nome), pronomes (só no perfil) e até 5 emblemas
 * (o primeiro acompanha o nome por todo o app; todos aparecem no perfil). O nome de
 * cadastro continua existindo para o dono da conta e para a empresa que recebe a
 * candidatura — que vê os dois nomes, um abaixo do outro.
 */
export function IdentitySection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const badgeUpload = useMediaUpload();
  const badgeInputRef = useRef<HTMLInputElement>(null);

  const [socialName, setSocialName] = useState("");
  const [nickname, setNickname] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    if (!me) return;
    setSocialName(me.socialName ?? "");
    setNickname(me.nickname ?? "");
    setPronouns(me.pronouns ?? "");
    setBadges(me.badges ?? (me.badge ? [me.badge] : []));
  }, [me]);

  const saveIdentity = useMutation({
    mutationFn: () =>
      preferencesApi.setIdentity({
        socialName: socialName.trim() || null,
        nickname: nickname.trim() || null,
        pronouns: pronouns.trim() || null,
      }),
    onSuccess: () => {
      toast(texts.account.identity.saved);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => toast(texts.account.identity.error, "error"),
  });

  const saveBadges = useMutation({
    mutationFn: (next: string[]) => preferencesApi.setBadges(next),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => toast(texts.account.identity.error, "error"),
  });

  const addBadge = async (file: File) => {
    if (badges.length >= MAX_BADGES) {
      toast(texts.account.identity.badgesFull, "error");
      return;
    }
    try {
      const result = await badgeUpload.upload(file, "BADGE");
      const next = [...badges, result.cdnUrl];
      setBadges(next);
      await saveBadges.mutateAsync(next);
    } catch {
      toast(texts.profile.imageUploadError, "error");
    }
  };

  const removeBadge = async (url: string) => {
    const next = badges.filter((badge) => badge !== url);
    setBadges(next);
    await saveBadges.mutateAsync(next);
  };

  return (
    <section className="surface-card space-y-3 p-4">
      <div>
        <h2 className="text-base font-medium">{texts.account.identity.title}</h2>

        <p className="mt-0.5 text-sm text-muted-foreground">{texts.account.identity.hint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {texts.account.identity.socialName}
          </Label>

          <Input
            value={socialName}
            onChange={(event) => setSocialName(event.target.value)}
            maxLength={160}
            placeholder={texts.account.identity.placeholderOptional}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{texts.account.identity.nickname}</Label>

          <Input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={60}
            placeholder={texts.account.identity.placeholderOptional}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{texts.account.identity.pronouns}</Label>

          <Input
            value={pronouns}
            onChange={(event) => setPronouns(event.target.value)}
            maxLength={60}
            placeholder="ela/dela"
          />
        </div>
      </div>

      <Button
        variant="outline"
        className="rounded-full"
        disabled={saveIdentity.isPending}
        onClick={() => saveIdentity.mutate()}
      >
        {texts.account.identity.save}
      </Button>

      {/* Emblemas: até 5 PNGs pequenos. O primeiro acompanha o nome em todo o app. */}
      <div className="space-y-2 border-t border-border-soft pt-3">
        <p className="text-xs font-medium text-text-strong">{texts.account.identity.badgesTitle}</p>

        <p className="text-xs font-normal text-text-subtle">{texts.account.identity.badgesHint}</p>

        {badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pl-1 pr-2"
              >
                <img
                  src={resolveCdnUrl(badge)}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />

                <button
                  type="button"
                  aria-label={`${texts.account.identity.badgesRemove} ${badges.indexOf(badge) + 1}`}
                  title={`${texts.account.identity.badgesRemove} ${badges.indexOf(badge) + 1}`}
                  disabled={saveBadges.isPending}
                  onClick={() => void removeBadge(badge)}
                  className="text-muted-foreground transition hover:text-destructive disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {badges.length < MAX_BADGES && (
          <>
            <input
              ref={badgeInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void addBadge(file);
                event.target.value = "";
              }}
            />

            <Button
              variant="outline"
              className="rounded-full"
              disabled={badgeUpload.status === "uploading" || saveBadges.isPending}
              onClick={() => badgeInputRef.current?.click()}
            >
              {badgeUpload.status === "uploading"
                ? texts.common.sending
                : texts.account.identity.badgesAdd}
            </Button>
          </>
        )}

        {badges.length >= MAX_BADGES && (
          <p className="text-xs font-normal text-text-date">{texts.account.identity.badgesFull}</p>
        )}
      </div>
    </section>
  );
}
