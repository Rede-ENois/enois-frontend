import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ProfileQuickComposerProps } from "@/types/components/profile/profile-quick-composer-props";
import { FilePenLine, Image, Send, Video } from "lucide-react";

import { feedApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { UserAvatar } from "@/components/user-avatar";

export function ProfileQuickComposer({ profile }: ProfileQuickComposerProps) {
  const [content, setContent] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const publish = useMutation({
    mutationFn: () => feedApi.create({ type: "INSIGHT", content: content.trim() }),
    onSuccess: () => {
      setContent("");
      void queryClient.invalidateQueries({ queryKey: ["feed", "user", profile.id] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast(texts.profile.dashboard.composer.success, "success");
    },
    onError: () => toast(texts.profile.dashboard.composer.error, "error"),
  });

  return (
    <section className="rounded-2xl border border-primary/20 bg-surface-card p-4 shadow-[0_20px_60px_-44px_color-mix(in_oklab,var(--primary)_95%,transparent)] sm:p-5">
      {!isComposerOpen ? (
        <>
          <div className="flex items-center gap-3">
            <UserAvatar
              frame={profile.avatarFrame}
              src={resolveCdnUrl(profile.avatar)}
              alt={profile.name}
              className="h-10 w-10 shrink-0"
            />

            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="flex h-11 flex-1 items-center rounded-full border border-border-soft bg-surface-1 px-5 text-left text-sm font-medium text-text-subtle transition hover:border-primary/40 hover:bg-surface-2 hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {texts.profile.dashboard.composer.start}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 divide-x divide-border-soft border-t border-border-soft pt-3">
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-text-subtle transition hover:bg-surface-2 hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Video className="h-4 w-4 text-primary" />
              {texts.profile.dashboard.composer.video}
            </button>

            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-text-subtle transition hover:bg-surface-2 hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Image className="h-4 w-4 text-primary" />
              {texts.profile.dashboard.composer.photo}
            </button>

            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-text-subtle transition hover:bg-surface-2 hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FilePenLine className="h-4 w-4 text-primary" />
              {texts.profile.dashboard.composer.article}
            </button>
          </div>
        </>
      ) : (
        <>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={texts.profile.dashboard.composer.placeholder}
            rows={3}
            maxLength={1000}
            autoFocus
            className="min-h-[7rem] resize-none border-border-soft bg-surface-1 text-sm leading-relaxed shadow-inner"
          />

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-soft pt-3">
            <p className="text-xs text-text-subtle">{texts.profile.dashboard.composer.hint}</p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  setContent("");
                  setIsComposerOpen(false);
                }}
              >
                {texts.common.cancel}
              </Button>

              <Button
                size="sm"
                className="shrink-0 gap-1.5 rounded-full"
                onClick={() => publish.mutate()}
                disabled={!content.trim() || publish.isPending}
              >
                <Send className="h-3.5 w-3.5" />

                <>
                  {publish.isPending
                    ? texts.common.sending
                    : texts.profile.dashboard.composer.action}
                </>
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
