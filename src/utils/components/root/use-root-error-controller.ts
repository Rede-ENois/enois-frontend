import { useRouter } from "@tanstack/react-router";

import type { ErrorComponentProps } from "@/types/components/root/error-component-props";

export function useRootErrorController({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  console.error(error);

  return {
    retry: () => {
      router.invalidate();
      reset();
    },
  };
}
