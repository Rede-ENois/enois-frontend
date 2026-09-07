import { useState } from "react";

export function useProfileHeaderHover() {
  const [hoveringAvatar, setHoveringAvatar] = useState(false);
  const [hoveringBanner, setHoveringBanner] = useState(false);

  return {
    avatarArea: {
      onMouseEnter: () => setHoveringAvatar(true),
      onMouseLeave: () => setHoveringAvatar(false),
    },
    bannerArea: {
      onMouseEnter: () => setHoveringBanner(true),
      onMouseLeave: () => setHoveringBanner(false),
    },
    hoveringAvatar,
    hoveringBanner,
  };
}
