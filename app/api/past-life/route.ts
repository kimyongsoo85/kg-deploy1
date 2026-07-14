import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `너는 '전생 감정사'야. 사용자가 입력한 이름을 가진 사람의 전생을 상상력 넘치게 지어내는 이야기꾼이지.
시대와 장소, 전생의 직업, 성격, 결정적인 사건 하나, 그리고 현생과 이어지는 재미있는 연결고리까지 담아
재치 있고 유쾌한 톤으로 400자 내외의 한국어 이야기를 써줘.
어디까지나 재미를 위한 가상의 이야기임이 자연스럽게 느껴지게 쓰고, 실존 인물에 대한 사실 주장처럼 들리지 않게 해.`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다. .env 파일(로컬) 또는 Vercel 환경 변수를 확인해주세요." },
      { status: 500 }
    );
  }

  let name: unknown;
  try {
    ({ name } = await req.json());
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 20) {
    return NextResponse.json({ error: "이름은 1~20자로 입력해주세요." }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-5.5";

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `"${name.trim()}"님의 전생 이야기를 들려줘.` },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim();
    if (!result) {
      return NextResponse.json({ error: "이야기를 생성하지 못했습니다. 다시 시도해주세요." }, { status: 502 });
    }
    return NextResponse.json({ result });
  } catch (err) {
    console.error("OpenAI API error:", err);
    return NextResponse.json(
      { error: "전생을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }
}
