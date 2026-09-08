import { useSearch } from "@tanstack/react-router";

export function useAuthFormPanelController() {
  const { tab } = useSearch({ from: "/entrar" });

  return {
    showSignup: tab === "signup",
  };
}
