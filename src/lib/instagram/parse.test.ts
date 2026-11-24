import { describe, expect, it } from "vitest";
import { bioEmail, extractMentions, hostList, normalizeHandle, pickReels, qualify, slugFromLinkInBio, usesLinkInBio, type IgProfile } from "./parse";

describe("extractMentions", () => {
  it("finds handles, drops emails, trailing dots and the account itself", () => {
    const got = extractMentions(["Shot with @Juno.Park. and @film_lab!", "mail me: hi@example.com", "thanks @me @123"], ["me"]);
    expect(got).toEqual(["juno.park", "film_lab"]);
  });
});

describe("link-in-bio checks", () => {
  const hosts = hostList("https://linktr.ee/\nbeacons.ai");
  it("normalizes the hosts box", () => expect(hosts).toEqual(["linktr.ee", "beacons.ai"]));
  it("matches bio links with or without a scheme", () => {
    expect(usesLinkInBio("linktr.ee/juno", hosts)).toBe(true);
    expect(usesLinkInBio("https://www.linktr.ee/juno", hosts)).toBe(true);
    expect(usesLinkInBio("https://notlinktr.ee/juno", hosts)).toBe(false);
    expect(usesLinkInBio(undefined, hosts)).toBe(false);
  });
  it("pulls a slug out of a search result", () => {
    expect(slugFromLinkInBio("https://linktr.ee/Juno.Park?utm=x", hosts)).toBe("juno.park");
    expect(slugFromLinkInBio("https://example.com/juno", hosts)).toBeNull();
  });
});

describe("qualify", () => {
  const reel = (i: number) => ({ id: String(i), media_type: "VIDEO", media_product_type: "REELS", media_url: `https://cdn/${i}.mp4`, timestamp: `2026-11-0${i}` });
  const base: IgProfile = { username: "juno", website: "https://linktr.ee/juno", followers_count: 5000, media: [reel(1), reel(2), reel(3), { id: "x", media_type: "IMAGE" }] };
  const rules = { hosts: ["linktr.ee"], minFollowers: 1000, maxFollowers: 100000, minReels: 3 };
  it("accepts a match", () => expect(qualify(base, rules)).toEqual({ ok: true }));
  it("says why it rejects", () => {
    expect(qualify({ ...base, website: "https://juno.studio" }, rules)).toEqual({ ok: false, reason: "bio link is juno.studio" });
    expect(qualify({ ...base, followers_count: 10 }, rules)).toMatchObject({ ok: false });
    expect(qualify({ ...base, media: [reel(1)] }, rules)).toEqual({ ok: false, reason: "1 reels, under 3" });
  });
  it("picks newest reels first", () => expect(pickReels(base.media, 2).map((m) => m.id)).toEqual(["3", "2"]));
});

describe("bioEmail", () => {
  it("only takes a single published address", () => {
    expect(bioEmail("Collabs: Hello@Juno.studio")).toBe("hello@juno.studio");
    expect(bioEmail("a@b.co or c@d.co")).toBeNull();
    expect(bioEmail("no email here")).toBeNull();
  });
});

describe("normalizeHandle", () => {
  it("accepts pasted profile links", () => {
    expect(normalizeHandle("instagram.com/clay.daily")).toBe("clay.daily");
    expect(normalizeHandle("https://www.instagram.com/Clay.Daily/?hl=en")).toBe("clay.daily");
    expect(normalizeHandle("@juno_park")).toBe("juno_park");
    expect(normalizeHandle("not a handle!")).toBeNull();
  });
});
