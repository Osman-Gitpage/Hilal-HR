import type { Metadata } from "next";
import { FirmaYonetimView } from "@/components/modules/cari/FirmaYonetimView";

export const metadata: Metadata = { title: "Firma Yönetimi — Cari" };

export default function FirmaPage() {
  return <FirmaYonetimView />;
}
