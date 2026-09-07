import { texts } from "@/texts";
import { z } from "zod";

export const resetPasswordSchema = z.object({
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});
