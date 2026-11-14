import type { TimeSlot } from "@/types/application/mentor/time-slot";
import { describe, expect, it } from "vitest";

import { bookableSlots } from "./bookable-slots";

const slot = (overrides: Partial<TimeSlot> & { id: string }): TimeSlot => ({
  startsAt: "2026-12-01T18:00:00Z",
  endsAt: "2026-12-01T19:00:00Z",
  available: true,
  ...overrides,
});

describe("bookableSlots", () => {
  it("entrega só o id e o começo que o seletor do design system usa", () => {
    expect(bookableSlots([slot({ id: "slot_a", startsAt: "2026-12-01T18:00:00Z" })])).toEqual([
      { id: "slot_a", startsAt: "2026-12-01T18:00:00Z" },
    ]);
  });

  it("descarta o horário já reservado: quem escolhesse cairia num 409 garantido", () => {
    expect(bookableSlots([slot({ id: "slot_taken", available: false })])).toEqual([]);
  });

  it("descarta o horário sem começo em vez de desenhar uma opção que não abre", () => {
    expect(bookableSlots([slot({ id: "slot_sem_data", startsAt: null })])).toEqual([]);
  });

  it("preserva a ordem publicada pelo servidor quando há mais de um horário", () => {
    const slots = bookableSlots([
      slot({ id: "slot_c", startsAt: "2026-12-03T18:00:00Z" }),
      slot({ id: "slot_a", startsAt: "2026-12-01T18:00:00Z" }),
      slot({ id: "slot_b", startsAt: "2026-12-02T18:00:00Z" }),
    ]);

    expect(slots.map((item) => item.id)).toEqual(["slot_c", "slot_a", "slot_b"]);
  });

  it("lista vazia continua vazia", () => {
    expect(bookableSlots([])).toEqual([]);
  });
});
