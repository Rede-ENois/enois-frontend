import type { Area } from "react-easy-crop";

export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image();
    nextImage.crossOrigin = "anonymous";
    nextImage.src = imageSrc;
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const context = canvas.getContext("2d")!;
  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.9,
    );
  });
}
