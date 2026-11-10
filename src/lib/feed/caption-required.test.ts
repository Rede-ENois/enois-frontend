import { describe, expect, it } from "vitest";

import { captionRequired } from "./caption-required";

describe("captionRequired", () => {
  it("asks for a caption when media is attached and the text is empty", () => {
    expect(captionRequired({ postType: "INSIGHT", mediaCount: 1, draft: "" })).toBe(true);
  });

  it("treats whitespace as empty, like the publish button does", () => {
    expect(captionRequired({ postType: "MOMENT", mediaCount: 2, draft: "  \n " })).toBe(true);
  });

  it("stays quiet once there is text", () => {
    expect(captionRequired({ postType: "INSIGHT", mediaCount: 1, draft: "Olha isso" })).toBe(false);
  });

  it("stays quiet without media: an empty composer is not an error", () => {
    expect(captionRequired({ postType: "INSIGHT", mediaCount: 0, draft: "" })).toBe(false);
  });

  it.each(["PAGE", "ARTICLE", "POLL"] as const)(
    "leaves %s out: its top field is not a caption",
    (postType) => {
      expect(captionRequired({ postType, mediaCount: 1, draft: "" })).toBe(false);
    },
  );
});
