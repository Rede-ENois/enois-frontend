import { z } from "zod";

import { texts } from "@/texts";

export const emailSchema = z.string().trim().email(texts.auth.validation.invalidEmail);
