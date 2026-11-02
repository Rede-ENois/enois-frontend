import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { preferencesApi } from "@/lib/api";
import { useIsAuthenticated } from "@/lib/use-auth";

/** Os três controles de personalização, da mesma fonte única do backend. */
export function usePersonalization() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["personalization"],
    queryFn: () => preferencesApi.getPersonalization(),
    enabled: authenticated,
    staleTime: 60_000,
  });
}

/** Módulos desativados pelo usuário (vazio = tudo habilitado, o padrão). */
export function useDisabledModules(): Set<string> {
  const { data } = usePersonalization();
  return new Set(data?.disabledModules ?? []);
}

/**
 * Turns a module back on. Reads the preferences fresh instead of trusting the cache: the module
 * may have been turned off in another tab, and a stale list would overwrite that change.
 */
export function useReenableModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (module: string) => {
      const current = await preferencesApi.getPersonalization();
      await preferencesApi.setPersonalization({
        disabledModules: (current.disabledModules ?? []).filter((value) => value !== module),
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["personalization"] }),
  });
}
