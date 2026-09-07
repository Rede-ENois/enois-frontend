import { z } from "zod";

export const authRouteSearchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional().default("signup"),
});
