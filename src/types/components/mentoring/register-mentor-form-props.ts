import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";

export type RegisterMentorFormProps = {
  onSave: (values: CreateMentorInput) => void;
  isPending: boolean;
};
