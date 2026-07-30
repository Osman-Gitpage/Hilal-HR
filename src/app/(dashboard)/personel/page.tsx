import type { Metadata } from "next";
import { PersonelListesiView } from "@/components/modules/personel/PersonelListesiView";

export const metadata: Metadata = { title: "Personel Yönetimi — Hilal Office" };

export default function PersonelPage() {
  return <PersonelListesiView />;
}
