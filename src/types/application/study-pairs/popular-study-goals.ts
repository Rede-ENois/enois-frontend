import type { PopularStudyGoal } from "./popular-study-goal";

/** GET /study-pairs/goals/popular */
export type PopularStudyGoals = {
  items: PopularStudyGoal[];
};
