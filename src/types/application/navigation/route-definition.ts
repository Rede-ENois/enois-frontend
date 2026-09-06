export type Navigate = (options: {
  to: string;
  params?: Record<string, string>;
}) => void;

export type RouteDefinition = {
  source: string;
  to: string;
  params?: readonly string[];
};
