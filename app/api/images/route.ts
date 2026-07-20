import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await list();

    // 1. FILTER: Only keep actual image files (ignore active-song.json or other configs)
    const imageBlobs = response.blobs.filter((blob) => {
      const pathname = blob.pathname.toLowerCase();
      return (
        pathname.endsWith(".webp") ||
        pathname.endsWith(".jpg") ||
        pathname.endsWith(".jpeg") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".gif") ||
        pathname.endsWith(".heic")
      );
    });

    // 2. SORT: Apply the existing sorting logic to the filtered image array
    const sortedBlobs = imageBlobs.sort((a, b) => {
      const isOldA = a.pathname.startsWith("trc-pinterest-");
      const isOldB = b.pathname.startsWith("trc-pinterest-");

      const numA = isOldA
        ? parseInt(a.pathname.match(/\d+/)?.[0] || "0", 10)
        : 0;
      const numB = isOldB
        ? parseInt(b.pathname.match(/\d+/)?.[0] || "0", 10)
        : 0;

      // Both new uploads -> newest date first
      if (!isOldA && !isOldB) {
        return (
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
      }

      // One new, one old -> new goes on top
      if (!isOldA && isOldB) return -1;
      if (isOldA && !isOldB) return 1;

      // Both old files -> numeric ascending
      return numA - numB;
    });

    const imageUrls = sortedBlobs.map((b) => b.url);
    return NextResponse.json(imageUrls);
  } catch (error) {
    console.error("BLOB FETCH ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
