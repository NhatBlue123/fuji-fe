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

function toFrameName(fileName: string) {
  return fileName
    .replace(/\.webp$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export async function GET() {
  const framesDir = path.join(process.cwd(), "public", "images", "khung_avatar");
  const files = await readdir(framesDir);

  const frames: AvatarFrame[] = files
    .filter((file) => /\.webp$/i.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file, index) => ({
      id: file.replace(/\.webp$/i, ""),
      name: toFrameName(file),
      src: `${AVATAR_FRAME_DIR}/${file}`,
      isDefault: index < DEFAULT_AVATAR_FRAME_LIMIT,
    }));

  return NextResponse.json({ frames });
}
