import { type ChangeEvent, useCallback, useState } from "react";

import type { Area, Point } from "react-easy-crop";

export function useImageCropState() {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropChange = useCallback((location: Point) => setCrop(location), []);
  const handleZoomChange = useCallback((value: number) => setZoom(value), []);
  const handleZoomInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setZoom(Number(event.target.value));
  }, []);
  const handleCropAreaChange = useCallback((_: Area, area: Area) => {
    setCroppedAreaPixels(area);
  }, []);

  return {
    crop,
    zoom,
    croppedAreaPixels,
    handleCropChange,
    handleZoomChange,
    handleZoomInputChange,
    handleCropAreaChange,
  };
}
