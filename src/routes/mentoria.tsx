import { useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
import type { MentorCardProps } from "@/types/routes/mentoring/mentor-card-props";
import type { RegisterMentorFormProps } from "@/types/routes/mentoring/register-mentor-form-props";
import { Calendar, CheckCircle2, Image as ImageIcon, Sparkles, Star, Trash2 } from "lucide-react";

import { ApiError, mentorsApi, profileApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { useCurrentUser } from "@/lib/current-user";
import { requireAuth } from "@/lib/require-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { AppContainer } from "@/components/app-container";
import { ListRowSkeletons } from "@/components/skeletons/list-row-skeletons";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/mentoria")({
  head: () => ({ meta: [{ title: texts.mentoring.seoTitle }] }),
  component: Mentoria,
});

function Mentoria() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [slotsForMentorId, setSlotsForMentorId] = useState<string | null>(null);

  const {
    data: mentorsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["mentors"],
    // 200: a lista já era renderizada inteira; e precisamos achar o perfil do próprio usuário
    // mesmo quando ele não está nas primeiras 20 posições.
    queryFn: () => mentorsApi.list(undefined, null, 200),
  });

  const mentors = mentorsData?.items ?? [];

  // `useCurrentUser` (e não o getter síncrono) para o botão recalcular quando o perfil chega:
  // no primeiro render o cache ainda está vazio e o perfil do mentor não era reconhecido.
  const { data: me } = useCurrentUser();
  const currentUserId = me?.id ?? null;
  // Quem já tem perfil de mentor edita o existente; "criar" de novo batia em 409 e a tela
  // escondia o motivo atrás de um erro genérico.
  const myMentor = mentors.find((m) => m.userId === currentUserId);

  const saveMentor = useMutation({
    mutationFn: (data: CreateMentorInput) =>
      myMentor ? mentorsApi.update(myMentor.id, data) : mentorsApi.create(data),
    onSuccess: (mentor, data) => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      setOpen(false);
      setCreateError(null);
      if (!myMentor) {
        // Sem slots ninguem consegue pedir mentoria: abre o dialog de horarios no card do mentor
        // recem-criado (o formulario "Tornar-me mentor" nao tinha essa etapa).
        setSlotsForMentorId(mentor.id);
      }
    },
    onError: (error) =>
      setCreateError(
        error instanceof ApiError && error.code === "ALREADY_MENTOR"
          ? texts.mentoring.alreadyMentor
          : error instanceof Error
            ? error.message
            : texts.mentoring.createError,
      ),
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <div
          className="surface-card relative overflow-hidden p-5 sm:p-8"
          style={{ background: "var(--gradient-soft)" }}
        >
          <div className="relative">
            <Badge className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
              <Sparkles className="mr-1 h-3 w-3" />

              <>{texts.mentoring.badge}</>
            </Badge>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{texts.mentoring.title}</h1>

            <p className="mt-2 text-muted-foreground">{texts.mentoring.description}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                className="rounded-full"
                onClick={() => {
                  const el = document.getElementById("mentores-lista");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {texts.mentoring.findMentor}
              </Button>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    {myMentor ? texts.mentoring.editMentor : texts.mentoring.becomeMentor}
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {myMentor
                        ? texts.mentoring.editMentorTitle
                        : texts.mentoring.becomeMentorTitle}
                    </DialogTitle>
                  </DialogHeader>

                  <RegisterMentorForm
                    key={myMentor?.id ?? "new"}
                    onSave={(data) => {
                      requireAuth();
                      saveMentor.mutate(data);
                    }}
                    isPending={saveMentor.isPending}
                    initialExpertise={myMentor?.expertise.join(", ")}
                    initialPrice={myMentor?.price}
                    initialBanner={myMentor?.banner ?? undefined}
                  />

                  {createError && (
                    <p className="mt-3 rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                      {createError}
                    </p>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div id="mentores-lista">
          <h2 className="text-lg font-semibold">{texts.mentoring.featured}</h2>

          <p className="text-sm text-muted-foreground">{texts.mentoring.featuredDescription}</p>

          {isLoading && (
            <div className="mt-4">
              <ListRowSkeletons count={3} />
            </div>
          )}

          {!isLoading && isError && (
            <div className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p>{texts.mentoring.loadError}</p>

              <Button
                variant="outline"
                size="sm"
                className="mt-2 rounded-full"
                onClick={() => refetch()}
              >
                {texts.mentoring.retry}
              </Button>
            </div>
          )}

          {!isLoading && !isError && mentors.length === 0 && (
            <div className="mt-4 rounded-xl border border-border-soft">
              <EmptyState icon={Sparkles} title={texts.mentoring.empty} />
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {mentors.map((m) => (
              <MentorCard key={m.id} mentor={m} openSlots={slotsForMentorId === m.id} />
            ))}
          </div>
        </div>
      </div>
    </AppContainer>
  );
}

function RegisterMentorForm({
  onSave,
  isPending,
  initialExpertise,
  initialPrice,
  initialBanner,
}: RegisterMentorFormProps) {
  const [skillsText, setSkillsText] = useState(initialExpertise ?? "");
  const [price, setPrice] = useState(initialPrice ?? texts.mentoring.free);
  const [banner, setBanner] = useState(initialBanner ?? "");
  const [bannerError, setBannerError] = useState<string | null>(null);
  const upload = useMediaUpload();
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const uploadBanner = async (file: File) => {
    setBannerError(null);
    try {
      const result = await upload.upload(file, "MENTOR_BANNER");
      setBanner(result.cdnUrl);
    } catch (error) {
      setBannerError(error instanceof Error ? error.message : texts.mentoring.bannerError);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.mentoring.bannerLabel}</Label>

        {banner ? (
          <div className="relative overflow-hidden rounded-xl border border-border-soft">
            <img src={resolveCdnUrl(banner)} alt="" className="h-28 w-full object-cover" />

            <button
              type="button"
              onClick={() => setBanner("")}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-destructive shadow"
              aria-label={texts.mentoring.bannerRemove}
              title={texts.mentoring.bannerRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-soft text-sm text-text-subtle transition hover:bg-muted"
          >
            <ImageIcon className="h-4 w-4" />

            <>
              {upload.status === "uploading" ? texts.common.saving : texts.mentoring.bannerUpload}
            </>
          </button>
        )}

        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void uploadBanner(file);
          }}
        />

        <p className="text-xs text-text-subtle">{texts.mentoring.bannerHint}</p>
        {bannerError && <p className="text-xs text-destructive">{bannerError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.mentoring.expertise}</Label>

        <Input
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          placeholder={texts.mentoring.expertisePlaceholder}
          className="h-10 border-transparent bg-muted"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.mentoring.investment}</Label>

        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={texts.mentoring.free}
          className="h-10 border-transparent bg-muted"
        />
      </div>

      <Button
        className="w-full rounded-full"
        disabled={!skillsText.trim() || isPending}
        onClick={() => {
          const expertise = skillsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          onSave({ expertise, price: price || texts.mentoring.free, banner: banner || null });
        }}
      >
        {isPending ? texts.common.saving : texts.common.save}
      </Button>
    </div>
  );
}

function MentorCard({ mentor, openSlots = false }: MentorCardProps & { openSlots?: boolean }) {
  // Reativo: busca o /me quando o cache ainda nao tem. O cache-only fazia o "Gerenciar horarios"
  // sumir para o PROPRIO mentor (isOwner false sem motivo).
  const { data: me } = useCurrentUser();
  const isOwner = me?.id != null && me.id === mentor.userId;

  const { data: user } = useQuery({
    queryKey: ["profile", mentor.userId],
    queryFn: () => profileApi.getById(mentor.userId),
  });

  return (
    <article className="surface-card mx-auto w-full max-w-5xl space-y-4 overflow-hidden p-5">
      {mentor.banner && (
        <img
          src={resolveCdnUrl(mentor.banner)}
          alt=""
          className="-mx-5 -mt-5 mb-1 h-36 w-[calc(100%+2.5rem)] object-cover"
        />
      )}

      {/* Grid de 12 colunas a partir de md: antes o container era `flex` e os `md:col-span-*`
          não tinham efeito nenhum, então o card não se organizava como pretendido. */}
      <header className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Avatar / imagem de destaque */}
        <div className="md:col-span-3">
          <div className="flex h-full items-start justify-center overflow-hidden md:justify-start">
            <UserAvatar
              src={user?.avatar}
              alt={user?.name ?? texts.mentoring.mentorFallback}
              className="h-14 w-14 shrink-0"
            />
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="space-y-4 overflow-hidden md:col-span-6">
          <Link
            to="/perfil/$username"
            params={{ username: user?.username ?? mentor.userId }}
            className="block truncate font-semibold hover:underline m-0"
          >
            {user?.name ?? texts.mentoring.mentorFallback}
          </Link>

          <p className="line-clamp-2 text-xs text-muted-foreground ">{user?.headline ?? ""}</p>
        </div>

        {/* Sidebar de estatísticas */}
        <div className="flex flex-col gap-4 md:col-span-3 text-sm">
          {isOwner ? (
            <AddSlotDialog mentorId={mentor.id} defaultOpen={openSlots} />
          ) : (
            <BookSessionDialog
              mentorId={mentor.id}
              mentorName={user?.name ?? texts.mentoring.mentorFallback}
            />
          )}
        </div>
      </header>

      <section>
        {mentor.expertise.map((e) => (
          <Badge
            key={e}
            variant="secondary"
            className="rounded-full bg-accent font-normal text-accent-foreground"
          >
            {e}
          </Badge>
        ))}
      </section>
      {/* Seção inferior */}
      <footer className="grid grid-cols-1 gap-8 rounded-2xl">
        <dl className=" grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
          <div>
            <dt className="text-muted-foreground">{texts.mentoring.rating}</dt>

            <dd className="mt-0.5 inline-flex items-center gap-1 font-semibold">
              <Star className="h-3.5 w-3.5 fill-opportunity text-opportunity" />

              <>{mentor.rating}</>
            </dd>
          </div>

          <div>
            <dt className="text-muted-foreground">{texts.mentoring.sessions}</dt>

            <dd className="mt-0.5 font-semibold">{mentor.sessions}</dd>
          </div>

          <div>
            <dt className="text-muted-foreground">{texts.mentoring.investment}</dt>

            <dd className="mt-0.5 font-medium">{mentor.price}</dd>
          </div>

          <div>
            <dt className="text-muted-foreground">{texts.mentoring.nextSlot}</dt>

            <dd className="mt-0.5 inline-flex items-center gap-1 font-medium">
              <Calendar className="h-3.5 w-3.5" />

              <>{mentor.nextSlot ? formatSlot(mentor.nextSlot) : texts.mentoring.noSlot}</>
            </dd>
          </div>
        </dl>
      </footer>
    </article>
  );
}

/**
 * Agendamento real: lista os horarios publicados pelo mentor (so os livres), deixa escolher um e
 * envia a solicitacao com uma mensagem opcional. Antes o botao "Agendar" nao tinha handler nenhum.
 */
function BookSessionDialog({ mentorId, mentorName }: { mentorId: string; mentorName: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mentor-slots", mentorId],
    queryFn: () => mentorsApi.getSlots(mentorId),
    enabled: open,
  });

  const slots = (data?.items ?? []).filter((slot) => slot.available);

  const book = useMutation({
    mutationFn: () => mentorsApi.bookSession(mentorId, slotId!, message.trim() || undefined),
    onSuccess: () => {
      setBooked(true);
      queryClient.invalidateQueries({ queryKey: ["mentor-slots", mentorId] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
    onError: () => setError(texts.mentoring.bookError),
  });

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSlotId(null);
      setMessage("");
      setError(null);
      setBooked(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button className="shrink-0 self-center rounded-lg bg-mentorship-button py-2 px-[14px]">
          {texts.mentoring.schedule}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.mentoring.bookTitle(mentorName)}</DialogTitle>
        </DialogHeader>

        {booked ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-growth" />

            <p className="mt-3 text-sm text-muted-foreground">{texts.mentoring.bookSuccess}</p>

            <Button className="mt-5 w-full rounded-full" onClick={() => close(false)}>
              {texts.common.close}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {isLoading && <ListRowSkeletons count={3} />}

            {!isLoading && isError && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <p>{texts.mentoring.slotsError}</p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 rounded-full"
                  onClick={() => refetch()}
                >
                  {texts.mentoring.retry}
                </Button>
              </div>
            )}

            {!isLoading && !isError && slots.length === 0 && (
              <p className="rounded-xl border border-border-soft px-4 py-6 text-center text-sm text-muted-foreground">
                {texts.mentoring.noSlots}
              </p>
            )}

            {slots.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{texts.mentoring.pickSlot}</Label>

                <div className="space-y-1.5">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSlotId(slot.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        slotId === slot.id
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border-soft hover:bg-muted"
                      }`}
                    >
                      {formatSlot(slot.startsAt)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {slots.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground" htmlFor="mentor-session-message">
                  {texts.mentoring.message}
                </Label>

                <Textarea
                  id="mentor-session-message"
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={texts.mentoring.messagePlaceholder}
                  maxLength={500}
                />
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {slots.length > 0 && (
              <Button
                className="w-full rounded-full"
                disabled={!slotId || book.isPending}
                onClick={() => {
                  setError(null);
                  requireAuth();
                  book.mutate();
                }}
              >
                {book.isPending ? texts.mentoring.booking : texts.mentoring.confirmBooking}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Agenda do mentor: publica um horario (dia/hora de inicio + duracao). Sem isso o agendamento nunca
 * teria o que oferecer.
 */
function AddSlotDialog({
  mentorId,
  defaultOpen = false,
}: {
  mentorId: string;
  defaultOpen?: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(defaultOpen);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [minutes, setMinutes] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ["mentor-slots", mentorId],
    queryFn: () => mentorsApi.getSlots(mentorId),
  });
  const slots = slotsData?.items ?? [];

  const removeSlot = useMutation({
    mutationFn: (slotId: string) => mentorsApi.deleteSlot(mentorId, slotId),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["mentor-slots", mentorId] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
    onError: () => setError(texts.mentoring.slotDeleteError),
  });

  const createSlot = useMutation({
    mutationFn: () => {
      const startsAt = new Date(`${date}T${time}:00`);
      const endsAt = new Date(startsAt.getTime() + Number(minutes) * 60_000);
      return mentorsApi.createSlot(mentorId, {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      queryClient.invalidateQueries({ queryKey: ["mentor-slots", mentorId] });
    },
    onError: () => setError(texts.mentoring.slotError),
  });

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setError(null);
      setSaved(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shrink-0 self-center rounded-lg py-2 px-[14px]">
          {texts.mentoring.manageSlots}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.mentoring.manageSlots}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{texts.mentoring.slotListTitle}</Label>

            {slotsLoading ? (
              <p className="text-sm text-text-subtle">{texts.mentoring.slotsLoading}</p>
            ) : slots.length === 0 ? (
              <p className="rounded-xl border border-border-soft px-3 py-3 text-sm text-text-subtle">
                {texts.mentoring.slotEmpty}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {slots.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border-soft px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {formatSlot(slot.startsAt)}
                      {!slot.available && ` · ${texts.mentoring.slotBooked}`}
                    </span>

                    {slot.available && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 rounded-full text-destructive"
                        disabled={removeSlot.isPending}
                        onClick={() => removeSlot.mutate(slot.id)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />

                        <>{texts.mentoring.slotDelete}</>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4 border-t border-border-soft pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground" htmlFor="slot-date">
                {texts.mentoring.slotDate}
              </Label>

              <Input
                id="slot-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground" htmlFor="slot-time">
                  {texts.mentoring.slotTime}
                </Label>

                <Input
                  id="slot-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground" htmlFor="slot-duration">
                  {texts.mentoring.slotDuration}
                </Label>

                <select
                  id="slot-duration"
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                  className="h-10 w-full rounded-md border border-transparent bg-muted px-3 text-sm"
                >
                  <option value="30">30 min</option>

                  <option value="45">45 min</option>

                  <option value="60">60 min</option>

                  <option value="90">90 min</option>
                </select>
              </div>
            </div>

            {saved && <p className="text-sm text-growth">{texts.mentoring.slotSuccess}</p>}

            {error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              className="w-full rounded-full"
              disabled={!date || createSlot.isPending}
              onClick={() => {
                setError(null);
                setSaved(false);
                createSlot.mutate();
              }}
            >
              {createSlot.isPending ? texts.common.saving : texts.mentoring.slotAction}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Data do horario no fuso de quem esta lendo. */
function formatSlot(value: string | null): string {
  if (!value) return texts.mentoring.noSlot;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return texts.mentoring.noSlot;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
