import { useEffect, useState } from "react";

import type { ProjectCoverProps } from "@/types/components/projects/project-cover-props";

/** Capa do projeto; se a URL não carregar como imagem, mostra o degradê padrão. */
export function ProjectCover({ src, className }: ProjectCoverProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <div className={className} style={{ background: "var(--gradient-primary)" }} />;
  }

  return (
    <img src={src} alt="" className={`${className} object-cover`} onError={() => setFailed(true)} />
  );
}
