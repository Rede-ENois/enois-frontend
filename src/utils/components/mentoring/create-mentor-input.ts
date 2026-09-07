import { texts } from "@/texts";
import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";

export function createMentorInput(skillsText: string, price: string): CreateMentorInput {
  return {
    expertise: skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
    price: price || texts.mentoring.free,
  };
}
