export type CompanyDirectoryEntry = {
  name: string;
  logo: string;
  openJobs: number;
  origem?: "enois" | "externa" | null;
};
