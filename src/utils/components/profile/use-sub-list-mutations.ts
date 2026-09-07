import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";
import type { SubListUpdate } from "@/types/components/profile/edit-profile-dialog/sub-list-update";

export function useSubListMutations<
  T extends Record<"id", string>,
  TData extends Record<string, unknown>,
>(
  props: Pick<SubListProps<T, TData>, "createApi" | "updateApi" | "deleteApi" | "queryKey">,
  onSaved: () => void,
) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: props.queryKey });
  const create = useMutation({
    mutationFn: (data: TData) => props.createApi(data),
    onSuccess: () => {
      invalidate();
      onSaved();
    },
  });
  const update = useMutation({
    mutationFn: ({ id, data }: SubListUpdate<TData>) => props.updateApi(id, data),
    onSuccess: () => {
      invalidate();
      onSaved();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => props.deleteApi(id),
    onSuccess: invalidate,
  });

  return {
    create: (data: TData) => create.mutateAsync(data),
    update: (id: string, data: TData) => update.mutateAsync({ id, data }),
    remove: (id: string) => remove.mutate(id),
    isPending: create.isPending || update.isPending,
  };
}
