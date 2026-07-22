import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    // 1. Authenticate with Bearer Token header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!filename || !request.body) {
      return NextResponse.json(
        { error: "Missing file or filename" },
        { status: 400 },
      );
    }

    // 2. Upload file binary into a 'songs/' blob prefix
    const blob = await put(`songs/${filename}`, request.body, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("SONG UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: "Failed to upload song" },
      { status: 500 },
    );
  }
}
