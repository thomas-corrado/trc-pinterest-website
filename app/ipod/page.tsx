import type { Metadata } from "next";
import IpodPlayer from "./IpodPlayer";

type IpodPageProps = {
  searchParams: Promise<{ song?: string | string[] }>;
};

function getSharedSongTitle(songParam?: string | string[]) {
  const song = Array.isArray(songParam) ? songParam[0] : songParam;
  if (!song) return null;

  let filename: string;
  try {
    const pathname = new URL(song, "https://trc.invalid").pathname;
    filename = decodeURIComponent(pathname.split("/").pop() || song);
  } catch {
    filename = song.split("/").pop() || song;
  }

  const title = filename
    .replace(/\.(m4a|mp3)$/i, "")
    .replace(/^\d{10,}-/, "")
    .replace(/_/g, " ");

  return title || null;
}

export async function generateMetadata({
  searchParams,
}: IpodPageProps): Promise<Metadata> {
  const { song } = await searchParams;
  const songTitle = getSharedSongTitle(song);
  const title = songTitle || "iPod music player";
  const openGraphTitle = songTitle
    ? `${songTitle} | trc iPod`
    : "trc iPod music player";
  const description = songTitle
    ? `Listen to ${songTitle} on the trc iPod music player.`
    : "Browse and play music on the trc iPod music player.";

  return {
    title,
    description,
    openGraph: {
      title: openGraphTitle,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: openGraphTitle,
      description,
    },
  };
}

export default function IpodPage() {
  return <IpodPlayer />;
}
