import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
import type { MentorCardProps } from "@/types/routes/mentoring/mentor-card-props";
import type { RegisterMentorFormProps } from "@/types/routes/mentoring/register-mentor-form-props";
import { Calendar, CheckCircle2, Loader2, Sparkles, Star } from "lucide-react";

import { mentorsApi, profileApi } from "@/lib/api";
import { getCurrentUserId, useCurrentUser } from "@/lib/current-user";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

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
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/mentoria")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: buildPageShareTags({ title: texts.mentoring.seoTitle, path: "/mentoria" }),
  }),
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
    queryFn: () => mentorsApi.list(),
  });

  const mentors = mentorsData?.items ?? [];

  const createMentor = useMutation({
    mutationFn: (data: CreateMentorInput) => mentorsApi.create(data),
    onSuccess: (mentor) => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      setOpen(false);
      setCreateError(null);
      // Sem slots ninguem consegue pedir mentoria: abre o dialog de horarios no card do mentor
      // recem-criado (o formulario "Tornar-me mentor" nao tinha essa etapa).
      setSlotsForMentorId(mentor.id);
    },
    // Antes a falha era silenciosa: o dialogo fechava sem publicar e nada explicava o motivo.
    onError: () => setCreateError(texts.mentoring.createError),
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
                    {texts.mentoring.becomeMentor}
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{texts.mentoring.becomeMentorTitle}</DialogTitle>
                  </DialogHeader>

                  <RegisterMentorForm
                    onSave={(data) => createMentor.mutate(data)}
                    isPending={createMentor.isPending}
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
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />

              <>{texts.mentoring.loading}</>
            </p>
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

function RegisterMentorForm({ onSave, isPending }: RegisterMentorFormProps) {
  const [skillsText, setSkillsText] = useState("");
  const [price, setPrice] = useState(texts.mentoring.free);

  return (
    <div className="space-y-4 pt-2">
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
          onSave({ expertise, price: price || texts.mentoring.free });
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
    <article className="surface-card mx-auto w-full max-w-5xl space-y-4 p-5">
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
            {isLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />

                <>{texts.mentoring.slotsLoading}</>
              </p>
            )}

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
function AddSlotDialog({ mentorId, defaultOpen = false }: { mentorId: string; defaultOpen?: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(defaultOpen);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [minutes, setMinutes] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
          <DialogTitle className="font-normal">{texts.mentoring.slotTitle}</DialogTitle>
        </DialogHeader>

        {saved ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-growth" />

            <p className="mt-3 text-sm text-muted-foreground">{texts.mentoring.slotSuccess}</p>

            <Button className="mt-5 w-full rounded-full" onClick={() => setSaved(false)}>
              {texts.mentoring.slotNew}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
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
                createSlot.mutate();
              }}
            >
              {createSlot.isPending ? texts.common.saving : texts.mentoring.slotAction}
            </Button>
          </div>
        )}
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
