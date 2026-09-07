import { useQuery } from "@tanstack/react-query";

import { listMentors } from "@/lib/api/mentors";

export function useMentoringPageController() {
  const { data: mentorsData } = useQuery({
    queryKey: ["mentors"],
    queryFn: () => listMentors(),
  });

  return {
    mentors: mentorsData?.items ?? [],
    scrollToMentors: () => {
      document.getElementById("mentores-lista")?.scrollIntoView({ behavior: "smooth" });
    },
  };
}
