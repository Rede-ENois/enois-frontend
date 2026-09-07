import { useState } from "react";

export function usePostActionsComments() {
  const [showComments, setShowComments] = useState(false);

  return {
    showComments,
    toggleComments: () => setShowComments((visible) => !visible),
  };
}
