import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import type { AuthUser } from "@/types/application/auth/auth-user";
import { type OnboardingStep, OnboardingView } from "@rede-enois/design-system/domain";

import { onboardingApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { markOnboardingShown, onboardingErrorMessage } from "@/lib/onboarding";

const TOPIC_OPTIONS = TOPICS.filter((topic) => topic !== "Todas").map((topic) => ({
  value: topic,
  label: TOPIC_LABELS[topic],
}));

const SKILL_SUGGESTIONS = [...texts.onboarding.skillSuggestions];

const topicLabel = (topic: string | null) =>
  topic ? (TOPIC_LABELS[topic as keyof typeof TOPIC_LABELS] ?? null) : null;

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

/**
 * Onboarding em dois passos sobre o `OnboardingView` do design system. O pacote inicial vem todo
 * marcado: guardamos só o que a pessoa DESMARCOU, então cada nova sugestão (voltar e trocar os
 * interesses) já chega escolhida sem efeito sincronizando estado. O backend devolve no máximo o
 * limite de cada lista, então "tudo marcado" nunca passa do teto.
 */
export function OnboardingFlow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentUser();
  const [step, setStep] = useState<OnboardingStep>("interests");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  // null = a pessoa ainda não mexeu: vale o que já está no perfil.
  const [editedSkills, setEditedSkills] = useState<string[] | null>(null);
  const [deselected, setDeselected] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shown means seen: marked here, on mount, never by whoever navigates here.
  useEffect(() => markOnboardingShown(), []);

  const skills = editedSkills ?? profile?.skills ?? [];

  const pack = useQuery({
    queryKey: ["onboarding", "starter-pack", selectedTopics, skills],
    queryFn: () => onboardingApi.starterPack(selectedTopics, skills),
    enabled: step === "pack",
    staleTime: 5 * 60_000,
  });

  const communities = pack.data?.communities ?? [];
  const groups = pack.data?.groups ?? [];
  const people = pack.data?.people ?? [];
  const chosen = (items: { id: string }[]) =>
    items.map((item) => item.id).filter((id) => !deselected.includes(id));

  const finish = async () => {
    queryClient.setQueryData<AuthUser>(["auth-me"], (user) =>
      user ? { ...user, onboardingCompleted: true } : user,
    );
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["auth-me"] }),
      queryClient.invalidateQueries({ queryKey: ["me"] }),
      queryClient.invalidateQueries({ queryKey: ["feed"] }),
    ]);
    void navigate({ to: "/feed", replace: true });
  };

  const complete = useMutation({
    mutationFn: () =>
      onboardingApi.complete({
        topics: selectedTopics,
        skills,
        communityIds: chosen(communities),
        groupIds: chosen(groups),
        connectUserIds: chosen(people),
      }),
    onMutate: () => setErrorMessage(null),
    onSuccess: finish,
    onError: (error) => setErrorMessage(onboardingErrorMessage(error)),
  });

  const skip = useMutation({
    mutationFn: () => onboardingApi.skip(),
    onMutate: () => setErrorMessage(null),
    onSuccess: finish,
    onError: (error) => setErrorMessage(onboardingErrorMessage(error)),
  });

  const toggleItem = (id: string) => setDeselected((list) => toggle(list, id));

  return (
    <OnboardingView
      step={step}
      onStepChange={(next) => {
        setErrorMessage(null);
        setStep(next);
      }}
      topics={TOPIC_OPTIONS}
      selectedTopics={selectedTopics}
      onToggleTopic={(value) => setSelectedTopics((list) => toggle(list, value))}
      skills={skills}
      skillSuggestions={SKILL_SUGGESTIONS}
      onAddSkill={(skill) => setEditedSkills([...skills, skill])}
      onRemoveSkill={(skill) => setEditedSkills(skills.filter((item) => item !== skill))}
      packLoading={pack.isPending && step === "pack"}
      packError={pack.isError}
      onRetryPack={() => void pack.refetch()}
      communities={communities.map((community) => ({
        id: community.id,
        name: community.name,
        description: community.description,
        topicLabel: topicLabel(community.topic),
        avatar: community.avatar,
        memberCount: community.memberCount,
      }))}
      groups={groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        topicLabel: topicLabel(group.topic),
        avatar: group.avatar,
        memberCount: group.memberCount,
      }))}
      people={people}
      selectedCommunityIds={chosen(communities)}
      selectedGroupIds={chosen(groups)}
      selectedPersonIds={chosen(people)}
      onToggleCommunity={toggleItem}
      onToggleGroup={toggleItem}
      onTogglePerson={toggleItem}
      submitting={complete.isPending || skip.isPending}
      errorMessage={errorMessage}
      onComplete={() => complete.mutate()}
      onSkip={() => skip.mutate()}
    />
  );
}
