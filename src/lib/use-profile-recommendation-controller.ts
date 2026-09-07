import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Profile } from "@/types/application/profile/profile";

import { createRecommendation } from "@/lib/api/recommendations/create-recommendation";
import { useAuth } from "@/lib/use-auth";

export function useProfileRecommendationController(user: Profile) {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  const recommend = useMutation({
    mutationFn: () => createRecommendation(user.id, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });
      setOpen(false);
      setComment("");
    },
  });

  return {
    visible: me?.id !== user.id,
    open,
    setOpen,
    comment,
    setComment,
    sending: recommend.isPending,
    send: () => recommend.mutate(),
  };
}
