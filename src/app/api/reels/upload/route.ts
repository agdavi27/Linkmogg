import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { db, pages } from "@/lib/db";
import { currentUser } from "@/lib/auth";

/**
 * Hands the browser a short-lived token so a reel clip can go straight to Blob storage.
 * Videos are too big to pass through a server action. The token only allows a video,
 * under 40 MB, at a path inside the signed-in person's own page folder.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Uploads aren't set up yet." }, { status: 503 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body, request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await currentUser();
        if (!user) throw new Error("Sign in first.");
        const [page] = await db.select({ id: pages.id }).from(pages).where(eq(pages.userId, user.id)).limit(1);
        if (!page || !pathname.startsWith(`reels/${page.id}/`)) throw new Error("Not your page.");
        return { allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm"], maximumSizeInBytes: 40 * 1024 * 1024, addRandomSuffix: true };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
