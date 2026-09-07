import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { COMMUNITY_TOPICS } from "@/constants/community-topics";
import type { CommunityTopic } from "@/types/application/community/community-topic";
import type { CreateCommunityInput } from "@/types/application/community/create-community-input";

import { createCommunity as createCommunityRequest } from "@/lib/api/communities/create-community";

const COMMUNITY_TOPIC_OPTIONS = COMMUNITY_TOPICS.filter(({ value }) => value !== "Todas");

function createInitialForm(): CreateCommunityInput {
  return {
    name: "",
    description: "",
    topic: "TECNOLOGIA",
  };
}

export function useCreateCommunityDialogController() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateCommunityInput>(createInitialForm);

  const create = useMutation({
    mutationFn: () => createCommunityRequest(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      setOpen(false);
      setForm(createInitialForm());
    },
  });

  const setField = <K extends keyof CreateCommunityInput>(
    field: K,
    value: CreateCommunityInput[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setTopic = (value: string) => {
    setField("topic", value as CommunityTopic);
  };

  return {
    open,
    setOpen,
    form,
    setField,
    setTopic,
    topicOptions: COMMUNITY_TOPIC_OPTIONS,
    createPending: create.isPending,
    createDisabled: !form.name.trim() || !form.description.trim() || create.isPending,
    createCommunity: () => create.mutate(),
  };
}
