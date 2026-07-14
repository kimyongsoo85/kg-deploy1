# 🔮 전생 감정소 (kg-deploy1)

이름을 입력하면 OpenAI 모델이 그 사람의 전생 이야기를 지어주는 vonvon 스타일 단일 기능 웹 서비스입니다.

## 기술 스택
- Next.js (App Router) + TypeScript
- OpenAI API (`OPENAI_MODEL` 환경 변수로 모델 지정, 기본값 `gpt-5.5`)
- Vercel 배포

## 로컬 실행
```bash
npm install
# .env 파일에 OPENAI_API_KEY 입력 후
npm run dev
```

## 환경 변수
| 이름 | 설명 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API 키 (필수) |
| `OPENAI_MODEL` | 사용할 모델 (기본값: `gpt-5.5`) |

## Vercel 배포
1. Vercel에서 이 깃허브 저장소를 Import
2. Project Settings → Environment Variables 에 `OPENAI_API_KEY` (와 필요시 `OPENAI_MODEL`) 등록
3. Deploy — 이후 `main` 브랜치에 push 할 때마다 자동 배포됩니다.

> `.env` 파일은 로컬 개발용이며 깃허브에 올라가지 않습니다. Vercel에는 대시보드에서 환경 변수를 직접 등록해야 합니다.
