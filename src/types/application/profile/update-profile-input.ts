export type UpdateProfileInput = {
  username?: string;
  name?: string;
  headline?: string | null;
  company?: string | null;
  location?: string | null;
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  skills?: string[];
  goals?: string[];
  availability?: string | null;
  portfolio?: string | null;
  externalLinks?: string[];
  openToWork?: boolean;
  isMentor?: boolean;
};
