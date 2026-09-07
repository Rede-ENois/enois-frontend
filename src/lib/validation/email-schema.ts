import { texts } from "@/texts";
import { z } from "zod";

export const emailSchema = z.string().trim().email(texts.auth.validation.invalidEmail);
