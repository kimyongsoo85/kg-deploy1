import { NextResponse } from "next/server";
import pastLives from "@/data/past-lives.json";

export const runtime = "nodejs";

export interface PastLifeRecord {
  id: number;
  being: string;
  era: string;
  death: string;
  achievement: string;
  memory: string;
}

// 같은 이름은 항상 같은 전생이 나오도록 이름을 해시해 150건 중 하나를 고른다
function hashName(name: string): number {
  let h = 5381;
  for (const ch of name) {
    h = ((h * 33) ^ ch.codePointAt(0)!) | 0;
  }
  return Math.abs(h);
}

export async function POST(req: Request) {
  let name: unknown;
  try {
    ({ name } = await req.json());
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 20) {
    return NextResponse.json({ error: "이름은 1~20자로 입력해주세요." }, { status: 400 });
  }

  const records = pastLives as PastLifeRecord[];
  const record = records[hashName(name.trim()) % records.length];

  return NextResponse.json({ name: name.trim(), record });
}
