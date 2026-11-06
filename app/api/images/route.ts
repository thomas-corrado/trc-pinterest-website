import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

const IMAGE_EXTENSIONS = [".webp", ".jpg", ".jpeg", ".png", ".gif", ".heic"];

function sortImagePaths(paths: string[], uploadedAtByPath?: Map<string, Date>) {
  return paths.sort((a, b) => {
    const isOldA = a.startsWith("trc-pinterest-");
    const isOldB = b.startsWith("trc-pinterest-");

    const numA = isOldA ? parseInt(a.match(/\d+/)?.[0] || "0", 10) : 0;
    const numB = isOldB ? parseInt(b.match(/\d+/)?.[0] || "0", 10) : 0;

    if (!isOldA && !isOldB) {
      const uploadedAtA = uploadedAtByPath?.get(a);
      const uploadedAtB = uploadedAtByPath?.get(b);
      if (uploadedAtA && uploadedAtB) {
        return uploadedAtB.getTime() - uploadedAtA.getTime();
      }
      return 0;
    }
    if (!isOldA && isOldB) return -1;
    if (isOldA && !isOldB) return 1;
    return numA - numB;
  });
}

export async function GET() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      const publicFiles = await readdir(join(process.cwd(), "public"));
      const localImages = publicFiles.filter((filename) =>
        filename !== "daniel-defoe.jpeg" &&
        IMAGE_EXTENSIONS.some((extension) =>
          filename.toLowerCase().endsWith(extension),
        ),
      );

      return NextResponse.json(
        sortImagePaths(localImages).map((filename) => `/${filename}`),
      );
    }

    const response = await list();

    const imageBlobs = response.blobs.filter((blob) => {
      const pathname = blob.pathname.toLowerCase();
      return (
        !pathname.startsWith("events/") &&
        IMAGE_EXTENSIONS.some((extension) => pathname.endsWith(extension))
      );
    });

    const urlsByPath = new Map(
      imageBlobs.map((blob) => [blob.pathname, blob.url] as const),
    );
    const uploadedAtByPath = new Map(
      imageBlobs.map((blob) => [blob.pathname, blob.uploadedAt] as const),
    );
    const imageUrls = sortImagePaths(
      imageBlobs.map((blob) => blob.pathname),
      uploadedAtByPath,
    )
      .map((pathname) => urlsByPath.get(pathname))
      .filter((url): url is string => url !== undefined);
    return NextResponse.json(imageUrls);
  } catch (error) {
    console.error("BLOB FETCH ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
