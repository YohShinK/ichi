import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const sourcePath = path.join(process.cwd(), "source", "camera-icon.png");

export async function GET() {
  const image = await readFile(sourcePath);

  return new NextResponse(image, {
    headers: {
      "cache-control": "no-store",
      "content-type": "image/png",
    },
  });
}
