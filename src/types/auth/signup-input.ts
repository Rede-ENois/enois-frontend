import type { LoginInput } from "./login-input";

export type SignupInput = LoginInput & {
  name: string;
};
