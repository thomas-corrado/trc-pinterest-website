import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await list();

    // Sort so newest images appear at the top of your layout
    // Sort by filename number if they are the old local images,
    // otherwise sort by newest upload date for phone uploads
    const sortedBlobs = response.blobs.sort((a, b) => {
      const numA = parseInt(a.pathname.match(/\d+/)?.[0] || "0", 10);
      const numB = parseInt(b.pathname.match(/\d+/)?.[0] || "0", 10);

      // If both files have numbers (your old local files)
      if (numA && numB) {
        return numA - numB; // Low numbers (trc-pinterest-1) first
      }

      // If one is an old file and one is a new phone upload,
      // put the new phone upload at the top
      if (numA && !numB) return 1; // 'a' is old, 'b' is new -> move 'b' up
      if (!numA && numB) return -1; // 'a' is new, 'b' is old -> move 'a' up

      // If both are new phone pictures, sort by newest upload time first
      return (
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    });

    // ADDED: Map out the public URLs and return them to the client page!
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
