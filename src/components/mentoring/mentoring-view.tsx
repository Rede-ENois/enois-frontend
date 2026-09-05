import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { Calendar, Sparkles, Star } from "lucide-react";

import type { Mentor, Profile } from "@/lib/api";
import { texts } from "@/texts";

import { UserAvatar } from "@/components/user-avatar";
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

export type MentorListItem = {
  mentor: Mentor;
  user?: Profile;
  isOwner: boolean;
};

export function MentoringHero({
  registrationOpen,
  registrationPending,
  onRegistrationOpenChange,
  onRegister,
}: {
  registrationOpen: boolean;
  registrationPending: boolean;
  onRegistrationOpenChange: (open: boolean) => void;
  onRegister: (data: { expertise: string[]; price: string }) => void;
}) {
  return (
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
            onClick={() => document.getElementById("mentores-lista")?.scrollIntoView({ behavior: "smooth" })}
          >
            {texts.mentoring.findMentor}
          </Button>
          <Dialog open={registrationOpen} onOpenChange={onRegistrationOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full">
                {texts.mentoring.becomeMentor}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{texts.mentoring.becomeMentorTitle}</DialogTitle>
              </DialogHeader>
              <RegisterMentorForm onSave={onRegister} isPending={registrationPending} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export function MentorsList({ items }: { items: MentorListItem[] }) {
  return (
    <div id="mentores-lista">
      <h2 className="text-lg font-semibold">{texts.mentoring.featured}</h2>
      <p className="text-sm text-muted-foreground">{texts.mentoring.featuredDescription}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <MentorCard key={item.mentor.id} {...item} />
        ))}
      </div>
    </div>
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
          onChange={(event) => setSkillsText(event.target.value)}
          placeholder={texts.mentoring.expertisePlaceholder}
          className="h-10 border-transparent bg-muted"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.mentoring.investment}</Label>
        <Input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
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
            .map((skill) => skill.trim())
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
  user,
  isOwner,
}: {
  mentor: Mentor;
  user?: Profile;
  isOwner: boolean;
}) {
  return (
    <article className="surface-card mx-auto w-full max-w-5xl space-y-4 p-5">
      <header className="flex flex-wrap">
        <div className="md:col-span-3">
          <div className="flex h-full items-start justify-center overflow-hidden">
            <UserAvatar
              src={user?.avatar}
              alt={user?.name ?? texts.mentoring.mentorFallback}
              className="h-14 w-14 shrink-0"
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-hidden px-4 md:col-span-6">
          <Link
            to="/perfil/$username"
            params={{ username: user?.username ?? mentor.userId }}
            className="m-0 block truncate font-semibold hover:underline"
          >
            {user?.name ?? texts.mentoring.mentorFallback}
          </Link>
          <p className="line-clamp-2 text-xs text-muted-foreground">{user?.headline ?? ""}</p>
        </div>

        <div className="flex flex-col gap-4 text-[13px] md:col-span-3">
          {!isOwner && (
            <Button className="shrink-0 self-center rounded-lg bg-mentorship-button px-[14px] py-2">
              {texts.mentoring.schedule}
            </Button>
          )}
        </div>
      </header>

      <section className="flex flex-wrap gap-1.5">
        {mentor.expertise.map((expertise) => (
          <Badge
            key={expertise}
            variant="secondary"
            className="rounded-full bg-accent font-normal text-accent-foreground"
          >
            {expertise}
          </Badge>
        ))}
      </section>

      <footer className="grid grid-cols-1 gap-8 rounded-2xl">
        <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
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
