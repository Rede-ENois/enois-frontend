import type { Message } from "@/types/application/message/message";

export interface DecryptedResult {
  messages: Message[];
  decrypting: boolean;
}
