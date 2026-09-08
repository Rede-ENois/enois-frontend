import { texts } from "@/texts";
import { useJobsPageContext } from "@/utils/components/jobs/use-jobs-page-context";
import { Briefcase } from "lucide-react";

export function useJobsFiltersInputsController() {
  const { query, skills, changeQuery, changeSkills } = useJobsPageContext();

  return {
    fields: [
      {
        key: "query",
        value: query,
        onChange: changeQuery,
        placeholder: texts.jobs.searchPlaceholder,
        className: "h-9 rounded-full bg-muted pl-9",
        wrapperClassName: "relative max-w-sm flex-1",
        icon: Briefcase,
      },
      {
        key: "skills",
        value: skills,
        onChange: changeSkills,
        placeholder: texts.jobs.skillsPlaceholder,
        className: "h-9 max-w-xs rounded-full bg-muted",
        wrapperClassName: null,
        icon: null,
      },
    ],
  };
}
