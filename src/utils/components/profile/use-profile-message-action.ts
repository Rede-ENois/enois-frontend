import { useNavigate } from "@tanstack/react-router";

export function useProfileMessageAction(requireAuth: () => boolean) {
  const navigate = useNavigate();

  return () => {
    if (!requireAuth()) return;
    navigate({ to: "/mensagens" });
  };
}
