import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";

import { createMentor as createMentorRequest } from "@/lib/api/mentors/create-mentor";

export function useCreateMentor(input: CreateMentorInput, onCreated: () => void) {
  const queryClient = useQueryClient();
  const createMentor = useMutation({
    mutationFn: () => createMentorRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      onCreated();
    },
  });

  return {
    saving: createMentor.isPending,
    save: () => createMentor.mutate(),
  };
}
