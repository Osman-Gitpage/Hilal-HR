import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cari / Fatura — Hilal Muhasebe",
  description: "Gemi bazlı cari takip, proforma ve fatura yönetimi",
};

export default function CariLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
