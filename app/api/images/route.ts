import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await list();

    // Sort logic: Phone pictures float to the top; old files sort from 1 to 123
    const sortedBlobs = response.blobs.sort((a, b) => {
      const numA = parseInt(a.pathname.match(/\d+/)?.[0] || "0", 10);
      const numB = parseInt(b.pathname.match(/\d+/)?.[0] || "0", 10);

      // 1. If both are new phone uploads (neither has a number in the filename)
      // Sort them by newest upload date first
      if (!numA && !numB) {
        return (
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
      }

      // 2. If one is a phone upload and one is an old file:
      // We want the phone upload (the one with NO number) to float to the top
      if (!numA && numB) return -1; // 'a' is a phone upload, move it up
      if (numA && !numB) return 1; // 'b' is a phone upload, move it up

      // 3. If both are old files (both have numbers)
      // Sort them in ascending order (trc-pinterest-1 at the top, 123 at the bottom)
      return numA - numB;
    });

    // Map out the public URLs from our sorted blobs array
    const imageUrls = sortedBlobs.map((b) => b.url);

    // Return the array to the client-side frontend
    return NextResponse.json(imageUrls);
  } catch (error) {
    // Logging the error clears the ESLint unused-var rule
    console.error("BLOB FETCH ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
