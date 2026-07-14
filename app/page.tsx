"use client";

import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setResult("");
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
        setResult(data.result);
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
        이름을 입력하면 AI가 당신의 전생 이야기를 들려드립니다
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

      {loading && <div className="card loading">🕰️ 시간을 거슬러 올라가는 중...</div>}
      {error && <div className="card error">{error}</div>}
      {result && <div className="card">{result}</div>}

      <p className="footer">※ 재미를 위한 가상의 이야기입니다.</p>
    </main>
  );
}
