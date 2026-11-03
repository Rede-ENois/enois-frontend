// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import {
  clearScrollDebug,
  recordScrollDebug,
  scrollDebugEnabled,
  scrollDebugReport,
} from "./scroll-debug";

afterEach(() => {
  clearScrollDebug();
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("scroll debug", () => {
  it("stays off unless asked, and remembers the ask for the session", () => {
    expect(scrollDebugEnabled()).toBe(false);
    window.history.replaceState(null, "", "/feed?debug=scroll");
    expect(scrollDebugEnabled()).toBe(true);
    window.history.replaceState(null, "", "/feed");
    expect(scrollDebugEnabled()).toBe(true);
  });

  it("reports the device, then one line per entry, keeping only the latest", () => {
    for (let i = 0; i < 805; i++) recordScrollDebug({ t: i, kind: "jump", from: 0, to: i });
    const lines = scrollDebugReport().split("\n");
    expect(lines).toHaveLength(801);
    expect(lines[0]).toContain(String(window.innerWidth));
    expect(JSON.parse(lines[1])).toMatchObject({ t: 5, kind: "jump" });
  });
});
