import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cari / Fatura — Hilal Muhasebe",
  description: "Firma, belge ve ödeme yönetimi",
};

export default function CariLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
