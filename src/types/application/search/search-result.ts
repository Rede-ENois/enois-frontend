export type SearchResult = {
  id: string;
  type: "users" | "communities" | "jobs" | "events";
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
};
