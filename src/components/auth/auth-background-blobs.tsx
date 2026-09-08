import { AUTH_BACKGROUND_BLOB_POSITIONS } from "@/constants/auth/auth-background-blob-positions";

export function AuthBackgroundBlobs() {
  return (
    <>
      {AUTH_BACKGROUND_BLOB_POSITIONS.map((position) => (
        <div
          key={position}
          aria-hidden
          className={`absolute h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl ${position}`}
        />
      ))}
    </>
  );
}
