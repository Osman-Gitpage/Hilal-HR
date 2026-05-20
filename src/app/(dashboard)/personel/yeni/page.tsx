import type { Metadata } from "next";
import { PersonelFormView } from "@/components/modules/personel/PersonelFormView";

export const metadata: Metadata = { title: "Personel Ekle — Hilal HR" };

export default function PersonelYeniPage() {
  return <PersonelFormView mod="yeni" />;
}
