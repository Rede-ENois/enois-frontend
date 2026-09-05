import { useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { mentorsApi, profileApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import type { MentorListItem } from "@/components/mentoring/mentor-list-item";
import { MentoringHero } from "@/components/mentoring/mentoring-hero";
import { MentorsList } from "@/components/mentoring/mentors-list";

export const Route = createFileRoute("/mentoria")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.mentoring.seoTitle }] }),
  component: MentoringRoute,
});

function MentoringRoute() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [registrationOpen, setRegistrationOpen] = useState(false);

  const { data: mentorsData } = useQuery({
    queryKey: ["mentors"],
    queryFn: () => mentorsApi.list(),
  });

  const mentors = mentorsData?.items ?? [];
  const mentorProfileQueries = useQueries({
    queries: mentors.map((mentor) => ({
      queryKey: ["profile", "by-id", mentor.userId],
      queryFn: () => profileApi.getById(mentor.userId),
      staleTime: 60_000,
    })),
  });
  const mentorItems: MentorListItem[] = mentors.map((mentor, index) => ({
    mentor,
    user: mentorProfileQueries[index]?.data,
    isOwner: currentUser?.id === mentor.userId,
  }));

  const createMentor = useMutation({
    mutationFn: (data: { expertise: string[]; price: string }) => mentorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      setRegistrationOpen(false);
    },
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <MentoringHero
          registrationOpen={registrationOpen}
          registrationPending={createMentor.isPending}
          onRegistrationOpenChange={setRegistrationOpen}
          onRegister={createMentor.mutate}
        />
        <MentorsList items={mentorItems} />
      </div>
    </AppContainer>
  );
}
