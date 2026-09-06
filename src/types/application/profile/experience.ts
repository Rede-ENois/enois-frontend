export type Experience = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  currentlyHere: boolean;
  startDate: string | null;
  endDate: string | null;
};

export type ExperienceInput = Pick<Experience, "title" | "company"> &
  Partial<Pick<Experience, "location" | "description" | "startDate" | "endDate">>;
