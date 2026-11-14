import type { TimeSlot } from "@/types/application/mentor/time-slot";
import type { BookableSlot } from "@/types/lib/mentoring/bookable-slot";

/**
 * Horários que dá para reservar: os marcados como disponíveis pelo servidor **e** com começo
 * conhecido. O `startsAt` é anulável no contrato, e um horário sem data não tem como ser mostrado
 * nem reservado — oferecê-lo colocaria na tela uma opção que quebra no clique.
 */
export function bookableSlots(slots: TimeSlot[]): BookableSlot[] {
  return slots.flatMap((slot) =>
    slot.available && slot.startsAt ? [{ id: slot.id, startsAt: slot.startsAt }] : [],
  );
}
