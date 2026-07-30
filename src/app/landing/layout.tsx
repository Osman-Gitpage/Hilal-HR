import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hilal Office — İnsan Kaynakları & Bordro Yönetim Sistemi",
  description:
    "Çok firmalı yapıyı tek platformdan yönetin. Personel, bordro, puantaj ve cari hesap modülleriyle eksiksiz İK yönetimi.",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-zinc-950 text-white min-h-screen">{children}</div>;
}
