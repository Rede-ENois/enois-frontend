/** Estado da foto do momento da denúncia: ainda pedindo, pronta ou a sala não tinha imagem legível. */
export type CallCaptureState =
  { status: "pending" } | { status: "ready"; dataUrl: string } | { status: "missing" };
