/** O que a remoção administrativa fez com a publicação. */
export type AdminPostRemovalView = {
  postId: string;
  /** REMOVED saiu do ar agora; ALREADY_OFFLINE já estava; NOT_FOUND não existe. */
  status: "REMOVED" | "ALREADY_OFFLINE" | "NOT_FOUND";
};
