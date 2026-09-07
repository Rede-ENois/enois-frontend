import { useState } from "react";

import { texts } from "@/texts";

import { ApiError } from "@/lib/api-client";

export function useProfileUsernameError() {
  const [usernameError, setUsernameError] = useState("");

  return {
    usernameError,
    clearUsernameError: () => setUsernameError(""),
    handleProfileUpdateError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        setUsernameError(texts.profile.edit.usernameTaken);
      }
    },
  };
}
