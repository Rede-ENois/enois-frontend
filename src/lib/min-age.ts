/**
 * A régua de idade da plataforma — cadastro e edição de perfil validam no mesmo lugar, com os
 * mesmos números que o backend aplica (`AgePolicy`: 16 para criar conta, 18 para deixar de ser
 * menor supervisionado). Data ISO `aaaa-mm-dd`; o cálculo considera o dia, não só o ano.
 */
export const MIN_AGE = 16;

/** Idade em que a supervisão de um responsável deixa de ser exigida. */
export const ADULT_AGE = 18;

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Idade completa na data de hoje, ou null quando a data não é válida. */
export function ageFromBirthDate(birthDate: string): number | null {
  if (!ISO_DATE.test(birthDate)) return null;
  const dob = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const months = now.getMonth() - dob.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) age--;
  if (age < 0 || age > 120) return null;
  return age;
}

/** Cadastro permitido: 16 anos ou mais (de 16 a 17 a conta nasce como menor supervisionado). */
export function hasMinAge(birthDate: string): boolean {
  const age = ageFromBirthDate(birthDate);
  return age !== null && age >= MIN_AGE;
}

/** Menor de 18 pelo cálculo do front — só para a cópia da tela; a decisão é do backend. */
export function isMinorAge(birthDate: string): boolean {
  const age = ageFromBirthDate(birthDate);
  return age !== null && age < ADULT_AGE;
}
