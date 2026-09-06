export type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  description: string | null;
  currentlyHere: boolean;
  startDate: string | null;
  endDate: string | null;
};

export type EducationInput = Pick<Education, "school" | "degree" | "field"> &
  Partial<Pick<Education, "description" | "startDate" | "endDate">>;
