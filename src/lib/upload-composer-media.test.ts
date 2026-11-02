import { describe, expect, it, vi } from "vitest";

import { uploadComposerMedia } from "./upload-composer-media";

describe("uploadComposerMedia", () => {
  it("reuses media checked at selection and uploads only the remaining files", async () => {
    const alreadyChecked = new File(["image"], "checked.png", { type: "image/png" });
    const pending = new File(["video"], "pending.mp4", { type: "video/mp4" });
    const uploadAll = vi.fn().mockResolvedValue([{ mediaId: "media_video" }]);

    const result = await uploadComposerMedia(
      [
        {
          type: "image",
          file: alreadyChecked,
          preview: "blob:checked",
          mediaId: "media_checked",
          moderationStatus: "allowed",
        },
        { type: "video", file: pending, preview: "blob:pending" },
      ],
      uploadAll,
    );

    expect(uploadAll).toHaveBeenCalledWith([{ file: pending }]);
    expect(result).toEqual(["media_checked", "media_video"]);
  });

  it("does not upload files again when every selection is already checked", async () => {
    const uploadAll = vi.fn();

    const result = await uploadComposerMedia(
      [
        {
          type: "image",
          file: new File(["image"], "checked.png", { type: "image/png" }),
          preview: "blob:checked",
          mediaId: "media_checked",
          moderationStatus: "allowed",
        },
      ],
      uploadAll,
    );

    expect(uploadAll).not.toHaveBeenCalled();
    expect(result).toEqual(["media_checked"]);
  });
});
