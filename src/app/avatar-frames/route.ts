import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  AVATAR_FRAME_DIR,
  DEFAULT_AVATAR_FRAME_LIMIT,
  type AvatarFrame,
} from "@/lib/avatar-frames";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FRAME_EXT = /\.(png|webp)$/i;

function toFrameName(fileName: string) {
  return fileName
    .replace(FRAME_EXT, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export async function GET() {
  const framesDir = path.join(process.cwd(), "public", "images", "khung_avatar_new");
  const files = await readdir(framesDir);

  const frames: AvatarFrame[] = files
    .filter((file) => FRAME_EXT.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file, index) => ({
      id: file.replace(FRAME_EXT, ""),
      name: toFrameName(file),
      src: `${AVATAR_FRAME_DIR}/${file}`,
      isDefault: index < DEFAULT_AVATAR_FRAME_LIMIT,
    }));

  return NextResponse.json({ frames });
}
