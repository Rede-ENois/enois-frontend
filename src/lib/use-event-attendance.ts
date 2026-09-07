import { useMutation, useQueryClient } from "@tanstack/react-query";

import { attendEvent } from "@/lib/api/events/attend-event";

export function useEventAttendance(eventId: string) {
  const queryClient = useQueryClient();
  const attend = useMutation({
    mutationFn: () => attendEvent(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  return { attend: () => attend.mutate(), attending: attend.isPending };
}
