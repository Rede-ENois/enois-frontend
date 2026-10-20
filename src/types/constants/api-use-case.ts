export type ApiUseCase = {
  id: string;
  title: string;
  description: string;
  steps: { note: string; code?: string }[];
};
