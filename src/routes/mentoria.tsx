import { useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { mentorApi, profileApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
import type { MentorViewModel } from "@/types/components/mentoring/mentor-view-model";

import { AppContainer } from "@/components/app-container";
import { MentoringHero } from "@/components/mentoring/mentoring-hero";
import { MentorsList } from "@/components/mentoring/mentors-list";

export const Route = createFileRoute("/mentoria")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.mentoring.seoTitle }] }),
  component: MentoringPage,
});

function MentoringPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const { data: mentorsData } = useQuery({
    queryKey: ["mentors"],
    queryFn: () => mentorApi.list(),
  });

  const mentors = mentorsData?.items ?? [];
  const mentorProfileQueries = useQueries({
    queries: mentors.map((mentor) => ({
      queryKey: ["profile", "by-id", mentor.userId],
      queryFn: () => profileApi.getById(mentor.userId),
      staleTime: 60_000,
    })),
  });
  const mentorViewModels: MentorViewModel[] = mentors.map((mentor, index) => ({
    mentor,
    user: mentorProfileQueries[index]?.data,
    isOwner: currentUser?.id === mentor.userId,
  }));

  const createMentorMutation = useMutation({
    mutationFn: (values: CreateMentorInput) => mentorApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      setIsRegistrationOpen(false);
    },
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <MentoringHero
          isRegistrationOpen={isRegistrationOpen}
          isRegistrationPending={createMentorMutation.isPending}
          onRegistrationOpenChange={setIsRegistrationOpen}
          onRegister={createMentorMutation.mutate}
        />
        <MentorsList mentors={mentorViewModels} />
      </div>
    </AppContainer>
  );
}
