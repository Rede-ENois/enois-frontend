export type CompanyMember = {
  userId: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "RECRUITER";
  createdAt: string;
};
