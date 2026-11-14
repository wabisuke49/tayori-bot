import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Cuculu Cleaning FAQ 検索",
  description: "Tayori FAQ を検索するための画面",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
