import { type QueryKey, useQuery } from "@tanstack/react-query";

import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";

export function useProfileSubListController<
  T extends Record<"id", string>,
  TData extends Record<string, unknown>,
>(
  queryKey: QueryKey,
  queryFn: () => Promise<T[]>,
  props: Omit<SubListProps<T, TData>, "items" | "queryKey">,
): SubListProps<T, TData> {
  const { data: items = [] } = useQuery({ queryKey, queryFn });

  return {
    ...props,
    items,
    queryKey,
  };
}
