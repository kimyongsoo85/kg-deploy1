import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "전생 감정소 | 이름으로 알아보는 나의 전생",
  description: "이름을 입력하면 AI가 당신의 전생 이야기를 들려드립니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
