import { useRef, useState } from "react";

import { texts } from "@/texts";
import type { SupportCategory } from "@/types/application/support/support-category";
import { CheckCircle2, Loader2, Paperclip, X } from "lucide-react";

import { ApiError, supportApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE = 10;

/**
 * Formulario de pedido de ajuda (atendimento humano). Fica num componente porque aparece em dois
 * lugares: a pagina /suporte (dentro do app) e a /contato (alcancavel sem login).
 */
export function SupportForm({ onSent }: { onSent?: () => void } = {}) {
  const currentUser = getCurrentUser();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState(currentUser?.email ?? "");
  const [category, setCategory] = useState<SupportCategory>("OTHER");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageUpload = useMediaUpload();

  const reset = () => {
    setSubject("");
    setMessage("");
    setErrors({});
    setFormError(null);
    setSent(false);
    setImageUrl(null);
  };

  const attachImage = async (file: File) => {
    try {
      const result = await imageUpload.upload(file, "POST_IMAGE");
      setImageUrl(result.cdnUrl);
    } catch {
      setFormError(texts.support.imageUploadError);
    }
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!subject.trim()) next.subject = texts.support.validationSubject;
    if (message.trim().length < MIN_MESSAGE) next.message = texts.support.validationMessage;
    if (!EMAIL_PATTERN.test(contactEmail.trim())) next.contactEmail = texts.support.validationEmail;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSending(true);
    try {
      await supportApi.open({
        subject: subject.trim(),
        message: message.trim(),
        contactEmail: contactEmail.trim(),
        category,
        imageUrl,
      });
      setSent(true);
      onSent?.();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : texts.support.error);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />

        <h2 className="mt-3 text-lg font-semibold tracking-tight">{texts.support.successTitle}</h2>

        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {texts.support.successDescription}
        </p>

        <Button variant="outline" className="mt-6 rounded-full" onClick={reset}>
          {texts.support.newRequest}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="support-subject">{texts.support.subject}</Label>

        <Input
          id="support-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={texts.support.subjectPlaceholder}
          maxLength={160}
        />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-category">{texts.support.category}</Label>

        <select
          id="support-category"
          value={category}
          onChange={(event) => {
            const value = event.target.value as SupportCategory;
            setCategory(value);
            // Pedido de API: o texto ja vem com os campos que o time precisa conferir.
            if (value === "API_ACCESS" && !message.trim()) {
              setMessage(texts.support.apiAccessTemplate);
            }
          }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        >
          {(["BUG", "ACCOUNT", "CONTENT", "IDEA", "API_ACCESS", "OTHER"] as SupportCategory[]).map(
            (value) => (
              <option key={value} value={value}>
                {texts.support.categories[value]}
              </option>
            ),
          )}
        </select>

        <p className="text-xs text-muted-foreground">{texts.support.categoryHint}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-message">{texts.support.message}</Label>

        <Textarea
          id="support-message"
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={texts.support.messagePlaceholder}
          maxLength={4000}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>

      {/* Anexo de imagem: o print que explica o pedido — chega como anexo no e-mail do time. */}
      <div className="space-y-1.5">
        <Label htmlFor="support-image" className="flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />

          <>{texts.support.attachImage}</>
        </Label>

        <input
          ref={fileRef}
          id="support-image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void attachImage(file);
            event.target.value = "";
          }}
        />

        {imageUrl ? (
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt=""
              className="h-24 w-auto rounded-lg border border-border-soft object-cover"
            />

            <button
              type="button"
              aria-label={texts.support.removeImage}
              title={texts.support.removeImage}
              onClick={() => setImageUrl(null)}
              className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-surface-card text-muted-foreground shadow-md transition hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={imageUpload.status === "uploading"}
            onClick={() => fileRef.current?.click()}
          >
            {imageUpload.status === "uploading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}

            <>
              {imageUpload.status === "uploading"
                ? texts.common.sending
                : texts.support.attachImageAction}
            </>
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-email">{texts.support.contactEmail}</Label>

        <Input
          id="support-email"
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          maxLength={255}
        />

        <p className="text-xs text-text-subtle">{texts.support.contactEmailHint}</p>
        {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail}</p>}
      </div>

      {formError && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button className="w-full rounded-full" disabled={sending} onClick={submit}>
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />

            <>{texts.support.sending}</>
          </>
        ) : (
          texts.support.action
        )}
      </Button>
    </div>
  );
}
