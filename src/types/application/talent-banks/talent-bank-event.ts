/** Um evento da trilha de uma inscrição. */
export type TalentBankEvent = {
  action: string;
  actorId: string | null;
  detail: string | null;
  createdAt: string;
};
