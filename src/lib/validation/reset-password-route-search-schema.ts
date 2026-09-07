import { z } from "zod";

export const resetPasswordRouteSearchSchema = z.object({
  token: z.string().optional(),
});
