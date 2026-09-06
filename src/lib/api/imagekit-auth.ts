import { createServerFn } from "@tanstack/react-start";

import crypto from "node:crypto";

import type { ImageKitAuth } from "@/types/application/imagekit/image-kit-auth";

export const getImageKitAuth = createServerFn({ method: "GET" }).handler(async () => {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY não configurada no servidor");
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 1800;
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  return { signature, token, expire } satisfies ImageKitAuth;
});
