import type { CompanyPerson } from "./company-person";

export type CompanyReview = {
  projectId: string;
  projectTitle: string;
  rating: number;
  text: string | null;
  createdAt: string;
  person: CompanyPerson;
};
