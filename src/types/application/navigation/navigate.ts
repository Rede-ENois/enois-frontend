export type Navigate = (options: {
  to: string;
  params?: Record<string, string>;
}) => void;
