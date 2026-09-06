export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string | null;
  location: string;
  type: string;
  level: string;
  salary: string | null;
  skills: string[];
  postedAt: string;
  matchScore: number | null;
};
