import { z } from "zod";

import { texts } from "@/texts";

export const resetPasswordSchema = z.object({
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});
