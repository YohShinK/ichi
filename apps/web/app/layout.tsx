import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./tokens.css";
import "./styles.css";
import "./v1-29.css";

export const metadata: Metadata = {
  title: "ICHI · 本地票池记录",
  description: "ICHI V1 低保真页面流",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
