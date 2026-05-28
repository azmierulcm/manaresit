import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manaresit",
  description: "Receipt scanning, budgeting, analytics, and e-invoice tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
