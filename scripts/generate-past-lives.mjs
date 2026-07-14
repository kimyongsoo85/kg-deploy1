// 150건의 전생 기록을 OpenAI API로 생성해 data/past-lives.json 에 저장하는 1회성 스크립트
// 실행: node --env-file=.env scripts/generate-past-lives.mjs
import OpenAI from "openai";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY가 없습니다. .env 파일을 확인하세요.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });
const MODEL_CANDIDATES = [process.env.OPENAI_MODEL ?? "gpt-5.5", "gpt-5.1", "gpt-5", "gpt-4.1", "gpt-4o"];

const BATCHES = [
  { theme: "선사시대~고대(기원전 150만년~서기 500년)의 인간. 다양한 직업: 수렵인, 동굴벽화가, 주술사, 청동기 장인, 피라미드 노동자, 검투사, 철학자의 제자, 비단길 상인 등", count: 25 },
  { theme: "중세~조선/근세(서기 500년~1800년)의 인간. 다양한 직업: 승려, 기사, 해적, 연금술사, 도공, 광대, 궁녀, 필사가, 향신료 상인, 탐험가의 요리사 등", count: 25 },
  { theme: "근대~현대(1800년~1980년)의 인간. 다양한 직업: 전신 기사, 무성영화 변사, 재봉사, 등대지기, 서커스 단원, 신문팔이, 라디오 성우, 버스 안내양 등", count: 25 },
  { theme: "포유류와 조류 동물. 예: 매머드, 검치호랑이, 시베리아 늑대, 왕실의 고양이, 전서구 비둘기, 알바트로스, 서커스 코끼리, 수도원의 당나귀 등", count: 25 },
  { theme: "바다 생물, 파충류, 양서류, 곤충. 예: 대왕고래, 심해 아귀, 갈라파고스 거북, 여왕벌, 반딧불이, 사마귀, 산호초의 문어, 개구리 등", count: 25 },
  { theme: "식물, 균류, 미생물, 아주 특이한 존재. 예: 천년 은행나무, 사막의 선인장, 동굴 이끼, 송이버섯, 효모, 빙하 속 박테리아, 바오밥나무, 민들레 홀씨 등", count: 25 },
];

const SYSTEM = `너는 '전생 기록 보관소'의 기록관이야. 재치 있고 유쾌한 한국어로 가상의 전생 기록을 만들어.
각 기록은 다음 5개 필드를 가진 JSON 객체야:
- "being": 전생의 직업 또는 존재 (예: "고구려의 말 조련사", "쥐라기... 아니, 빙하기의 매머드")
- "era": 시대 — 반드시 기원전 150만년 ~ 서기 1980년 사이. (예: "기원전 3만 2천년, 빙하기의 시베리아", "1923년, 경성")
- "death": 사인(죽은 이유) — 유머러스하거나 어이없거나 뭉클하게 (예: "낮잠 자다 굴러온 호박에 깔림")
- "achievement": 전생의 업적 (예: "부족 최초로 매운 열매를 요리에 넣음")
- "memory": 사람들(또는 동료 생물들)이 그 존재를 어떻게 기억하는지 (예: "'그 매머드 옆은 항상 따뜻했지'라고 회자됨")
모든 필드는 한국어 1~2문장, 구체적이고 개성 있게. 서로 절대 겹치지 않게.
응답은 반드시 {"records": [...]} 형태의 순수 JSON으로만.`;

async function generateBatch(model, theme, count, batchIdx) {
  const res = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `테마: ${theme}\n이 테마로 전생 기록 ${count}건을 만들어줘. records 배열에 정확히 ${count}개.`,
      },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text);
  const records = parsed.records ?? [];
  console.log(`  배치 ${batchIdx + 1}: ${records.length}건 생성 (모델: ${model})`);
  return records;
}

async function pickModel() {
  for (const m of MODEL_CANDIDATES) {
    try {
      await openai.chat.completions.create({
        model: m,
        max_completion_tokens: 16,
        messages: [{ role: "user", content: "ping" }],
      });
      return m;
    } catch (e) {
      console.log(`모델 ${m} 사용 불가 (${e?.status ?? e?.message}), 다음 후보 시도...`);
    }
  }
  throw new Error("사용 가능한 모델이 없습니다. API 키를 확인하세요.");
}

const model = await pickModel();
console.log(`사용 모델: ${model}`);

const all = [];
for (let i = 0; i < BATCHES.length; i++) {
  const { theme, count } = BATCHES[i];
  let records = [];
  for (let attempt = 1; attempt <= 3 && records.length < count; attempt++) {
    try {
      records = await generateBatch(model, theme, count, i);
    } catch (e) {
      console.log(`  배치 ${i + 1} 시도 ${attempt} 실패: ${e?.message}`);
    }
  }
  if (records.length === 0) throw new Error(`배치 ${i + 1} 생성 실패`);
  all.push(...records.slice(0, count));
}

// 5개 필드가 모두 채워진 레코드만, 정확히 150건으로 정리
const valid = all.filter(
  (r) => r && [r.being, r.era, r.death, r.achievement, r.memory].every((v) => typeof v === "string" && v.trim().length > 0)
);
console.log(`유효 레코드: ${valid.length}건`);
if (valid.length < 150) throw new Error(`150건 미만입니다 (${valid.length}건). 다시 실행해주세요.`);

const final = valid.slice(0, 150).map((r, i) => ({ id: i + 1, ...r }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "data");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "past-lives.json");
writeFileSync(outPath, JSON.stringify(final, null, 2), "utf8");
console.log(`저장 완료: ${outPath} (${final.length}건)`);
