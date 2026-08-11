import { readFile } from "node:fs/promises";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const sourcePath =
  "/Users/cunfu/Downloads/ChatGPT Image 2026年8月9日 23_44_26.png";

export async function GET() {
  const image = await readFile(sourcePath);

  return new NextResponse(image, {
    headers: {
      "cache-control": "no-store",
      "content-type": "image/png",
    },
  });
}
