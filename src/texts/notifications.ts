export const notificationsTexts = {
  title: "Notificações",
  markAllRead: "Ler tudo",
  overflowCount: "9+",
  tabs: {
    new: "Novas",
    history: "Histórico",
  },
  emptyNew: "Nenhuma notificação nova.",
  emptyHistory: "Nenhum histórico ainda.",
  markRead: "Lida",
  accept: "Aceitar",
  unreadLabel: (count: number) =>
    `${count} ${count === 1 ? "notificação não lida" : "notificações não lidas"}`,
} as const;
