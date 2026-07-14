"use client";

import { useState } from "react";

interface PastLifeRecord {
  id: number;
  being: string;
  era: string;
  death: string;
  achievement: string;
  memory: string;
}

const FIELDS: { key: keyof PastLifeRecord; icon: string; label: string }[] = [
  { key: "being", icon: "🧬", label: "전생의 직업 · 존재" },
  { key: "era", icon: "⏳", label: "시대" },
  { key: "death", icon: "💀", label: "사인 (죽은 이유)" },
  { key: "achievement", icon: "🏆", label: "전생의 업적" },
  { key: "memory", icon: "🗣️", label: "사람들의 기억" },
];

export default function Home() {
  const [name, setName] = useState("");
  const [record, setRecord] = useState<PastLifeRecord | null>(null);
  const [resultName, setResultName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setRecord(null);
    setError("");

    try {
      const res = await fetch("/api/past-life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "알 수 없는 오류가 발생했습니다.");
      } else {
        setRecord(data.record);
        setResultName(data.name);
      }
    } catch {
      setError("서버와 통신하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1 className="title">🔮 전생 감정소</h1>
      <p className="subtitle">
        이름을 입력하면 전생 기록 보관소에서 당신의 기록을 찾아드립니다
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요 (예: 김용수)"
          maxLength={20}
          aria-label="이름"
        />
        <button className="button" type="submit" disabled={loading || !name.trim()}>
          {loading ? "감정 중..." : "전생 보기"}
        </button>
      </form>

      {loading && <div className="card loading">🕰️ 기록 보관소를 뒤지는 중...</div>}
      {error && <div className="card error">{error}</div>}
      {record && (
        <div className="card">
          <h2 className="recordTitle">📜 {resultName}님의 전생 기록 #{record.id}</h2>
          <dl className="recordList">
            {FIELDS.map(({ key, icon, label }) => (
              <div className="recordRow" key={key}>
                <dt className="recordLabel">
                  {icon} {label}
                </dt>
                <dd className="recordValue">{record[key]}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="footer">※ 재미를 위한 가상의 이야기입니다. (전생 기록 150건 보유)</p>
    </main>
  );
}
