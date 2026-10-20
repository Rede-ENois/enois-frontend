import type { HttpMethod } from "./http-method";

export type ApiEndpoint = {
  method: HttpMethod;
  path: string;
  access: "public" | "auth" | "admin";
  description: string;
  request?: string;
  response?: string;
};
