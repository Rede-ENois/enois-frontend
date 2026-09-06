export type TimeSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
};

export type CreateTimeSlotInput = Pick<TimeSlot, "startsAt" | "endsAt">;
