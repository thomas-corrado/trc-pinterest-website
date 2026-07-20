import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await list();

    const sortedBlobs = response.blobs.sort((a, b) => {
      // 1. Check if the file belongs to your original archive prefix
      const isOldA = a.pathname.startsWith("trc-pinterest-");
      const isOldB = b.pathname.startsWith("trc-pinterest-");

      // 2. Extract numbers ONLY if it's an authentic old file
      const numA = isOldA
        ? parseInt(a.pathname.match(/\d+/)?.[0] || "0", 10)
        : 0;
      const numB = isOldB
        ? parseInt(b.pathname.match(/\d+/)?.[0] || "0", 10)
        : 0;

      // Rule A: If both are new uploads, sort by newest date first
      if (!isOldA && !isOldB) {
        return (
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
      }

      // Rule B: If one is a new upload and one is an old archive file,
      // push the new upload to the top (meaning 'a' goes up if it's new)
      if (!isOldA && isOldB) return -1;
      if (isOldA && !isOldB) return 1;

      // Rule C: If both are old files, sort them ascending (1 at the top, 123 at bottom)
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
