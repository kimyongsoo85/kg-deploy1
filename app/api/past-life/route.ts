import { NextResponse } from "next/server";
import OpenAI from "openai";
import pastLives from "@/data/past-lives.json";

export const runtime = "nodejs";
export const maxDuration = 60;

export interface PastLifeRecord {
  id: number;
  being: string;
  era: string;
  death: string;
  achievement: string;
  memory: string;
}

// 감동 → 병맛까지의 작문 뉘앙스 스펙트럼. 매 요청마다 하나가 랜덤으로 선택된다.
const TONES = [
  {
    label: "🥹 감동 실화",
    direction:
      "눈물샘을 자극하는 감동 실화 톤. 잔잔하게 시작해 마지막 문단에서 뭉클한 여운을 남겨라. 신파지만 품위 있게.",
  },
  {
    label: "🏯 대하 사극 내레이션",
    direction:
      "웅장한 대하 사극의 오프닝 내레이션 톤. '그 시대, 한 존재가 있었으니...' 같은 장중한 문어체로 서사시처럼 써라.",
  },
  {
    label: "🌿 자연 다큐멘터리",
    direction:
      "차분한 성우가 읽는 자연 다큐멘터리 내레이션 톤. 관찰자의 시선으로 담담하게, 그러나 경이로움을 담아 써라.",
  },
  {
    label: "🕵️ 하드보일드 느와르",
    direction:
      "비 내리는 밤의 하드보일드 느와르 독백 톤. 짧고 건조한 문장, 시니컬한 비유, 쓸쓸한 결말의 뒷맛.",
  },
  {
    label: "⚔️ 무협지",
    direction:
      "정통 무협지 톤. 강호, 초식, 내공 같은 무협 어휘를 섞어 그 존재의 일생을 한 편의 무용담으로 써라.",
  },
  {
    label: "💌 로맨스 소설",
    direction:
      "애틋한 로맨스 소설 톤. 그 존재가 무언가(존재, 일, 자연)와 나눈 애정을 중심에 두고 설레고 아련하게 써라.",
  },
  {
    label: "🧸 어린이 동화",
    direction:
      "따뜻한 어린이 동화 톤. '옛날 옛적에'로 시작해 쉬운 말로 다정하게, 끝에 귀여운 교훈 한 줄을 붙여라.",
  },
  {
    label: "📰 단독 보도 뉴스",
    direction:
      "아침 뉴스 앵커의 단독 보도 톤. [단독] 헤드라인으로 시작해 기자 리포트와 목격자 인터뷰 인용까지 뉴스 형식으로 써라.",
  },
  {
    label: "💬 인터넷 후기체",
    direction:
      "인터넷 커뮤니티 후기체 톤. 'ㅋㅋ', '아니 근데', '레전드' 같은 구어체로 친구에게 썰 풀듯 웃기게 써라. 비속어는 금지.",
  },
  {
    label: "🤪 완전 병맛",
    direction:
      "완전 병맛 개그 톤. 논리가 산으로 가는 아무말 대잔치, 뜬금없는 비유와 과장, 어이없는 반전. 읽다가 헛웃음이 나게 써라.",
  },
];

const SYSTEM_PROMPT = `너는 '전생 기록 보관소'의 전속 작가야. 보관소의 기록 원본(전생의 존재, 시대, 사인, 업적, 사람들의 기억)을 받아
그 사람의 전생 이야기를 한국어로 작문한다.

규칙:
- 분량은 공백 포함 500~800자. 이 범위를 반드시 지켜라.
- 기록 원본의 다섯 가지 사실(존재, 시대, 사인, 업적, 기억)을 모두 자연스럽게 녹여낼 것. 사실 자체를 바꾸지 말 것.
- 지시받은 작문 톤을 처음부터 끝까지 유지할 것.
- 입력된 이름을 이야기 속에서 자연스럽게 불러줄 것 (예: "김용수, 당신은...").
- 제목 없이 본문만. 어디까지나 재미를 위한 가상 이야기라는 느낌이 유지되게.`;

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

  const trimmedName = name.trim();
  const records = pastLives as PastLifeRecord[];
  const record = records[hashName(trimmedName) % records.length];
  const tone = TONES[Math.floor(Math.random() * TONES.length)];

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-5.5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `이름: ${trimmedName}
작문 톤: ${tone.label} — ${tone.direction}

[기록 원본 #${record.id}]
- 전생의 직업/존재: ${record.being}
- 시대: ${record.era}
- 사인: ${record.death}
- 업적: ${record.achievement}
- 사람들의 기억: ${record.memory}

위 기록으로 ${trimmedName}님의 전생 이야기를 작문해줘.`,
          },
        ],
      });

      const story = completion.choices[0]?.message?.content?.trim();
      if (story) {
        return NextResponse.json({ name: trimmedName, record, tone: tone.label, story });
      }
    } catch (err) {
      console.error("OpenAI API error:", err);
    }
  }

  // API 키가 없거나 OpenAI 호출이 실패해도 서비스는 기록 원본으로 동작한다
  return NextResponse.json({
    name: trimmedName,
    record,
    tone: null,
    story: null,
    notice: "작가가 잠시 자리를 비워 기록 원본을 그대로 보여드립니다.",
  });
}
