export type ErrorKind = "api" | "native" | "unknown";

export type ErrorDescription = {
  message: string;
  details: string[];
};
