import type { MicroProjectView } from "./micro-project-view";

export type CompanyDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sector: string | null;
  size: string | null;
  location: string | null;
  website: string | null;
  logo: string | null;
  cover: string | null;
  myRole: "OWNER" | "ADMIN" | "EDITOR" | "RECRUITER" | null;
  projects: MicroProjectView[];
};
