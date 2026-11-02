import type { CompanyPerson } from "./company-person";

export type CompanyMember = {
  userId: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "RECRUITER";
  createdAt: string;
  person: CompanyPerson | null;
};
