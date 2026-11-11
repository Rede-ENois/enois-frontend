import type { JobFilterInput } from "@/types/application/job/job-filter-input";
import type { ListJobsParams } from "@/types/application/job/list-jobs-params";

/**
 * Modelo de trabalho que o backend entende, a partir do rótulo do filtro "Local".
 *
 * A aba externa não aceita `location` (texto livre): o backend filtra por `workModel`, e mandar
 * `location` lá não filtrava nada — a lista voltava igual com ou sem o filtro.
 */
export const WORK_MODEL_BY_LOCATION: Record<string, string> = {
  Remoto: "REMOTE",
  Híbrido: "HYBRID",
  Presencial: "ONSITE",
};

/**
 * Vínculos que as fontes externas publicam. CLT e PJ são regimes brasileiros: nenhum agregador
 * internacional os informa, então oferecê-los na aba externa devolveria sempre lista vazia.
 */
export const EXTERNAL_JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "FREELANCE",
  "INTERNSHIP",
] as const;

export function workModelFor(location: string): string | undefined {
  return WORK_MODEL_BY_LOCATION[location];
}

/**
 * Os parâmetros de cada aba. As duas buscas têm vocabulário próprio no backend: a interna filtra
 * por `location`/`type`/`skills` (texto livre e códigos da casa), a externa por `workModel`/
 * `employmentType`/`city`/`country`. Mandar os da interna para a externa não filtra nada.
 */
export function buildJobFilters(input: JobFilterInput): ListJobsParams {
  const query = input.query || undefined;
  const level = input.level || undefined;

  if (input.aba === "externas") {
    // O filtro escolhido na aba do Énóis (CLT, PJ) não existe nas fontes externas: trocar de aba
    // com ele ligado devolveria lista vazia sem explicação. Só o que a fonte publica é enviado.
    const employmentType = (EXTERNAL_JOB_TYPES as readonly string[]).includes(input.type)
      ? input.type
      : undefined;
    return {
      query,
      level,
      workModel: workModelFor(input.location),
      employmentType,
    };
  }

  return {
    query,
    level,
    location: input.location || undefined,
    type: (input.lockedType ?? input.type) || undefined,
    skills: input.skills || undefined,
  };
}
