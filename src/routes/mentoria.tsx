import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Calendar, Sparkles, Star } from "lucide-react";

import { mentorsApi, profileApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AppContainer } from "@/components/app-container";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/mentoria")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.mentoring.seoTitle }] }),
  component: Mentoria,
});

function Mentoria() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: mentorsData } = useQuery({
    queryKey: ["mentors"],
    queryFn: () => mentorsApi.list(),
  });

  const mentors = mentorsData?.items ?? [];

  const createMentor = useMutation({
    mutationFn: (data: { expertise: string[]; price: string }) => mentorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      setOpen(false);
    },
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
              <Sparkles className="mr-1 h-3 w-3" /> {texts.mentoring.badge}
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
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div id="mentores-lista">
          <h2 className="text-lg font-semibold">{texts.mentoring.featured}</h2>
          <p className="text-sm text-muted-foreground">{texts.mentoring.featuredDescription}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {mentors.map((m) => (
              <MentorCard key={m.id} mentor={m} />
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
}: {
  onSave: (data: { expertise: string[]; price: string }) => void;
  isPending: boolean;
}) {
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

function MentorCard({
  mentor,
}: {
  mentor: {
    id: string;
    userId: string;
    expertise: string[];
    rating: number;
    sessions: number;
    price: string;
    nextSlot: string;
  };
}) {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.id === mentor.userId;

  const { data: user } = useQuery({
    queryKey: ["profile", mentor.userId],
    queryFn: () => profileApi.getById(mentor.userId),
  });

  return (
    <article className="surface-card mx-auto w-full max-w-5xl space-y-4 p-5">
      {/* Seção superior */}
      <header className="flex flex-wrap">
        {/* Avatar / imagem de destaque */}
        <div className="md:col-span-3">
          <div className="flex h-full items-start justify-center overflow-hidden">
            <UserAvatar
              src={user?.avatar}
              alt={user?.name ?? texts.mentoring.mentorFallback}
              className="h-14 w-14 shrink-0"
            />
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="space-y-4 px-4 md:col-span-6 flex-1 overflow-hidden">
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
        <div className="flex flex-col gap-4 md:col-span-3 text-[13px]">
          {!isOwner && (
            <Button className="shrink-0 self-center rounded-lg bg-mentorship-button py-2 px-[14px]">
              {texts.mentoring.schedule}
            </Button>
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
              <Star className="h-3.5 w-3.5 fill-opportunity text-opportunity" /> {mentor.rating}
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
              <Calendar className="h-3.5 w-3.5" /> {mentor.nextSlot}
            </dd>
          </div>
        </dl>
      </footer>
    </article>
  );
}
