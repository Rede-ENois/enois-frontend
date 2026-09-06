export type ServerEntry = {
  fetch: (request: Request, env: unknown, context: unknown) => Promise<Response> | Response;
};
