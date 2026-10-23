export const HttpStatus = {
  OK: 200,
  NO_CONTENT: 204,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOO_MANY_REQUESTS: 429,
} as const;
export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];
