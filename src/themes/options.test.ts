import { describe, expect, it } from "vitest";
import { instagramHandle, readThemeOptions } from "./options";
import { getTheme } from "./registry";

describe("instagramHandle", () => {
  it("reads profile links and bare handles", () => {
    expect(instagramHandle("https://www.instagram.com/Juno.Park/")).toBe("juno.park");
    expect(instagramHandle("instagram.com/juno_park?igsh=abc")).toBe("juno_park");
    expect(instagramHandle("@junopark")).toBe("junopark");
  });
  it("rejects post links and other sites", () => {
    expect(instagramHandle("https://instagram.com/reel/abc123")).toBeNull();
    expect(instagramHandle("https://example.com/junopark")).toBeNull();
    expect(instagramHandle("not a handle!")).toBeNull();
  });
});

describe("readThemeOptions", () => {
  it("keeps only https reels and known layouts", () => {
    const o = readThemeOptions({ layout: "sideways", instagram: { handle: "a", reels: ["https://x/1.mp4", "javascript:1", 4] } });
    expect(o.layout).toBeNull();
    expect(o.instagram).toEqual({ handle: "a", reels: ["https://x/1.mp4"] });
  });
});

describe("retired themes", () => {
  it("map to a theme that still exists", () => {
    for (const id of ["poster", "halo", "panorama", "scatter", "sunflower", "id", "glow", "window", "world", "discs", "strata", "mixtape", "prism"]) {
      expect(getTheme(id).id).not.toBe(id);
      expect(["stack", "cases", "meadow", "garden", "folders", "billboard"]).toContain(getTheme(id).id);
    }
    expect(getTheme("classic").id).toBe("classic");
  });
});
