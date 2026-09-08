export function AuthBackgroundBlobs() {
  const positions = ["-right-20 -top-20", "-bottom-32 -left-20"];

  return (
    <>
      {positions.map((position) => (
        <div
          key={position}
          aria-hidden
          className={`absolute h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl ${position}`}
        />
      ))}
    </>
  );
}
