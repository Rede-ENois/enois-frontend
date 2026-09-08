import { useMatch } from "@tanstack/react-router";

export function useAuthMobileHeaderController() {
  const authMatch = useMatch({ from: "/entrar", shouldThrow: false });

  return {
    showThemeToggle: authMatch !== undefined,
  };
}
