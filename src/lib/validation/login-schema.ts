import { z } from "zod";

import { emailSchema } from "@/lib/validation/email-schema";
import { texts } from "@/texts";

export const loginSchema = z.object({
  email: emailSchema.max(255),
  password: z.string().min(6, texts.auth.validation.loginPasswordMin).max(128),
});
