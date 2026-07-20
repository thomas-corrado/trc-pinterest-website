import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await list();
    // Sort so newest images appear at the top of your layout
    const sortedBlobs = response.blobs.sort((a, b) => {
      return (
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    });
    return NextResponse.json(sortedBlobs.map((b) => b.url));
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
