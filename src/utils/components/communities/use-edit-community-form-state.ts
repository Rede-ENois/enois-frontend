import { useState } from "react";

import type { Community } from "@/types/application/community/community";

export function useEditCommunityFormState(
  community: Pick<Community, "name" | "description" | "cover" | "avatar">,
) {
  const [form, setForm] = useState({
    name: community.name,
    description: community.description,
    cover: community.cover ?? "",
    avatar: community.avatar ?? "",
  });

  const setField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return { form, setField };
}
