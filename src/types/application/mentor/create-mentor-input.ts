export type CreateMentorInput = {
  expertise: string[];
  price: string;
};

export type UpdateMentorInput = Partial<CreateMentorInput>;
