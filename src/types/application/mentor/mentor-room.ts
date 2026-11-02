/** Sala configurada pelo mentor (visão do dono) — o link permanente não é público. */
export type MentorRoom = {
  roomMode: "JITSI_SESSION" | "JITSI_PERMANENT" | "CUSTOM";
  /** Link que a próxima sessão usa; `null` em JITSI_SESSION (a sala nasce no agendamento). */
  roomUrl: string | null;
  meetingUrl: string | null;
  jitsiRoom: string | null;
};
