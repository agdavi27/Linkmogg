import { describe, expect, it } from "vitest";
import { decodeDraft, encodeDraft, handleFrom, parsePasted } from "./convert";

describe("handleFrom", () => {
  it("reads Linktree addresses and bare handles", () => {
    expect(handleFrom("https://linktr.ee/Juno.Park")).toBe("juno.park");
    expect(handleFrom("linktr.ee/juno?utm=x")).toBe("juno");
    expect(handleFrom("@juno")).toBe("juno");
  });
});

describe("parsePasted", () => {
  it("takes titles before or after the URL, or from the line above", () => {
    const r = parsePasted([
      "Shop the new mugs - https://junopark.shop/mugs",
      "https://youtube.com/watch?v=abc | Latest video",
      "Book a wheel class",
      "calendly.com/juno/wheel",
    ].join("\n"));
    expect(r.links).toEqual([
      { title: "Shop the new mugs", url: "https://junopark.shop/mugs" },
      { title: "Latest video", url: "https://youtube.com/watch?v=abc" },
      { title: "Book a wheel class", url: "https://calendly.com/juno/wheel" },
    ]);
  });

  it("turns untitled profile links into social icons and drops duplicates", () => {
    const r = parsePasted("https://instagram.com/juno\nhttps://instagram.com/juno\nhello@juno.com");
    expect(r.socials).toEqual(["https://instagram.com/juno"]);
    expect(r.links).toEqual([{ title: "Email me", url: "mailto:hello@juno.com" }]);
  });
});

describe("draft encoding", () => {
  it("round-trips, including non-Latin text", () => {
    const d = { username: "juno", displayName: "Juno 🌻", bio: "Céramique", themeId: "garden", links: [{ title: "Shop", url: "https://a.com/" }], socials: ["https://instagram.com/juno"] };
    expect(decodeDraft(encodeDraft(d))).toEqual(d);
  });

  it("drops links that aren't real URLs", () => {
    const bad = btoa(JSON.stringify({ u: "x", l: [["Evil", "javascript:alert(1)"], ["Ok", "https://ok.com"]] }));
    expect(decodeDraft(bad)?.links).toEqual([{ title: "Ok", url: "https://ok.com/" }]);
  });
});
