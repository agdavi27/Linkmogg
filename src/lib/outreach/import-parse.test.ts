import { describe, expect, it } from "vitest";
import { parseImport } from "./import-parse";

describe("parseImport", () => {
  it("parses CSV with headers", () => {
    const rows = parseImport("handle,platform,link_url,email\nsam,tiktok,linktr.ee/sam,sam@x.com\n@lee,,https://bio.site/lee,", "instagram");
    expect(rows).toEqual([
      { handle: "sam", platform: "tiktok", sourceUrl: "https://linktr.ee/sam", email: "sam@x.com", name: null },
      { handle: "@lee", platform: "instagram", sourceUrl: "https://bio.site/lee", email: null, name: null },
    ]);
  });
  it("parses loose pasted lines", () => {
    const rows = parseImport("@sam https://linktr.ee/sam\nhttps://www.instagram.com/lee/ https://beacons.ai/lee lee@x.com", "instagram");
    expect(rows[0]).toMatchObject({ handle: "sam", sourceUrl: "https://linktr.ee/sam" });
    expect(rows[1]).toMatchObject({ handle: "lee", sourceUrl: "https://beacons.ai/lee", email: "lee@x.com" });
  });
});
