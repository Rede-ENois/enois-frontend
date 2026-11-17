// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { croppedFile } from "./cropped-file";

describe("croppedFile", () => {
  it("keeps a transparent crop as png, name and type", () => {
    const blob = new Blob([new Uint8Array(10)], { type: "image/png" });
    const file = croppedFile(blob);
    expect(file.type).toBe("image/png");
    expect(file.name).toBe("crop.png");
  });

  it("keeps an opaque crop as jpg", () => {
    const blob = new Blob([new Uint8Array(10)], { type: "image/jpeg" });
    const file = croppedFile(blob);
    expect(file.type).toBe("image/jpeg");
    expect(file.name).toBe("crop.jpg");
  });

  it("falls back to jpeg when the blob arrives without a type", () => {
    const file = croppedFile(new Blob([new Uint8Array(10)]));
    expect(file.type).toBe("image/jpeg");
    expect(file.name).toBe("crop.jpg");
  });
});
