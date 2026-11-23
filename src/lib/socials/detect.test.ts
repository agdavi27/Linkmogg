import { describe, expect, it } from "vitest";
import { detectPlatform, normalizeUrl } from "./detect";

describe("detectPlatform", () => {
  const cases: [string, string][] = [
    ["instagram.com/drew", "instagram"],
    ["https://www.tiktok.com/@drew", "tiktok"],
    ["https://twitter.com/drew", "x"],
    ["x.com/drew", "x"],
    ["https://youtu.be/abc", "youtube"],
    ["https://music.youtube.com/channel/1", "youtubemusic"],
    ["https://open.spotify.com/artist/1", "spotify"],
    ["https://music.apple.com/us/artist/1", "applemusic"],
    ["https://www.snapchat.com/add/drew", "snapchat"],
    ["https://www.threads.net/@drew", "threads"],
    ["https://www.linkedin.com/in/drew", "linkedin"],
    ["https://facebook.com/drew", "facebook"],
    ["https://pinterest.com/drew", "pinterest"],
    ["https://twitch.tv/drew", "twitch"],
    ["https://discord.gg/abc", "discord"],
    ["https://github.com/drew", "github"],
    ["https://drew.substack.com", "substack"],
    ["drew@example.com", "email"],
    ["https://mastodon.social/@drew", "mastodon"],
    ["https://hachyderm.io/@drew", "mastodon"],
    ["https://example.com", "website"],
  ];
  for (const [input, platform] of cases) {
    it(`${input} -> ${platform}`, () => expect(detectPlatform(input)?.platform).toBe(platform));
  }
  it("extracts handle", () => expect(detectPlatform("https://www.tiktok.com/@drew")?.handle).toBe("drew"));
  it("rejects junk", () => {
    expect(normalizeUrl("not a url")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  });
});
