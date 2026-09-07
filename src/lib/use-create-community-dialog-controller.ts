import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCommunity as createCommunityRequest } from "@/lib/api/communities/create-community";
import type { CreateCommunityInput } from "@/types/application/community/create-community-input";

export function useCreateCommunityDialogController() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateCommunityInput>({
    name: "",
    description: "",
    topic: "TECNOLOGIA",
  });

  const create = useMutation({
    mutationFn: () => createCommunityRequest(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      setOpen(false);
      setForm({ name: "", description: "", topic: "TECNOLOGIA" });
    },
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
    createPending: create.isPending,
    createCommunity: () => create.mutate(),
  };
}
