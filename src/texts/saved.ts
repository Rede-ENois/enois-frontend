export const savedTexts = {
  seoTitle: "Posts salvos · Énóis",
  back: "Voltar",
  title: "Posts salvos",
  count: (count: number) => `${count} post${count === 1 ? "" : "s"} salvo${count === 1 ? "" : "s"}`,
  empty: "Nenhum post salvo ainda. Salve posts para encontrá-los facilmente depois.",
} as const;
