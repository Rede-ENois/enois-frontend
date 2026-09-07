import { useState } from "react";

import { CREATE_COMMUNITY_TOPIC_OPTIONS } from "@/constants/create-community-topic-options";
import type { CommunityTopic } from "@/types/application/community/community-topic";
import type { CreateCommunityInput } from "@/types/application/community/create-community-input";

import { createInitialCommunityForm } from "@/utils/components/communities/create-initial-community-form";
import { useCreateCommunity } from "@/utils/components/communities/use-create-community";

export function useCreateCommunityDialogController() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateCommunityInput>(createInitialCommunityForm);
  const create = useCreateCommunity(form, () => {
    setOpen(false);
    setForm(createInitialCommunityForm());
  });

  const setField = <K extends keyof CreateCommunityInput>(
    field: K,
    value: CreateCommunityInput[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return {
    open,
    setOpen,
    form,
    setField,
    setTopic: (value: string) => setField("topic", value as CommunityTopic),
    topicOptions: CREATE_COMMUNITY_TOPIC_OPTIONS,
    createPending: create.createPending,
    createDisabled: !form.name.trim() || !form.description.trim() || create.createPending,
    createCommunity: create.createCommunity,
  };
}
