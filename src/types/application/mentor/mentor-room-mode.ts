/**
 * De onde vem a sala da sessão de mentoria (espelha o backend).
 *
 * - `EPAPO_SESSION`: uma sala por sessão no Epapo (padrão, nada para configurar);
 * - `EPAPO_PERMANENT`: uma sala fixa no Epapo, a mesma em toda sessão;
 * - `CUSTOM`: sala própria do mentor (Meet, Zoom...), um link externo.
 */
export type MentorRoomMode = "EPAPO_SESSION" | "EPAPO_PERMANENT" | "CUSTOM";
