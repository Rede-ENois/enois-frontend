import { z } from "zod";

import { emailSchema } from "@/lib/validation/email-schema";
import { texts } from "@/texts";

export const signupSchema = z.object({
  name: z.string().trim().min(2, texts.auth.validation.signupNameMin).max(80),
  email: emailSchema.max(255),
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});
