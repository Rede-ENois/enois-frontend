import type { SheetDerived } from "@/types/application/roleplay/sheet-derived";
import type { SheetEntry } from "@/types/application/roleplay/sheet-entry";

/** Ficha como o leitor enxerga: o recorte é decidido no servidor, nunca no cliente. */
export type Sheet = {
  id: string;
  campaignId: string;
  userId: string;
  name: string;
  entries: SheetEntry[];
  derived: SheetDerived[];
  createdAt: string;
  updatedAt: string;
};
