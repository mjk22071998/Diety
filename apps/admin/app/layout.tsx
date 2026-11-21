import type { Metadata } from "next";
import "./globals.css";
import { AdminShell } from "@/components/layout/AdminShell";

export const metadata: Metadata = {
  title: "Diety Platform • Admin & Tribunal Console",
  description: "Regulatory compliance, escrow governance, and dispute tribunal console.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-[#CBD5E1] min-h-screen antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
