export type EmailLogView = {
  id: string;
  toEmail: string;
  subject: string;
  kind: string;
  status: "SENT" | "FAILED";
  error: string | null;
  ip: string | null;
  createdAt: string;
};
