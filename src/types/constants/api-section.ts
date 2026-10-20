import type { ApiEndpoint } from "./api-endpoint";

export type ApiSection = {
  id: string;
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
};
