import { describe, expect, it } from "vitest";
import { parseLinkInBio } from "./parse";

describe("parseLinkInBio", () => {
  it("reads an embedded Next.js account blob", () => {
    const data = { props: { pageProps: { account: {
      pageTitle: "Sam Rivera", description: "Painter. hello@samrivera.art", profilePictureUrl: "https://cdn.example/a.jpg",
      links: [{ title: "Shop prints", url: "https://shop.example" }, { title: "Email me", url: "mailto:Sam@Example.com" }],
      socialLinks: [{ type: "INSTAGRAM", url: "https://instagram.com/sam" }],
    } } } };
    const html = `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script></body></html>`;
    const p = parseLinkInBio(html, "https://linktr.ee/sam");
    expect(p.displayName).toBe("Sam Rivera");
    expect(p.links).toHaveLength(2);
    expect(p.socials[0].platform).toBe("instagram");
    expect(p.email).toBe("sam@example.com");
  });

  it("falls back to meta tags and outbound anchors", () => {
    const html = `<html><head><title>x</title><meta property="og:title" content="Lee"><meta property="og:description" content="Music"><meta property="og:image" content="https://img/a.png"></head>
      <body><a href="/signup">Sign up</a><a href="https://open.spotify.com/artist/1">New single</a>
      <a href="https://instagram.com/lee" aria-label="instagram"></a><a href="mailto:lee@x.com">mail</a></body></html>`;
    const p = parseLinkInBio(html, "https://bio.example/lee");
    expect(p.displayName).toBe("Lee");
    expect(p.links).toEqual([{ title: "New single", url: "https://open.spotify.com/artist/1" }]);
    expect(p.socials).toEqual([{ platform: "instagram", url: "https://instagram.com/lee" }]);
    expect(p.email).toBe("lee@x.com");
  });
});
