import type { Metadata } from "next";
import { CariGenelView } from "@/components/modules/cari/CariGenelView";

export const metadata: Metadata = { title: "Cari Genel — Tüm Belgeler" };

export default function CariGenelPage() {
  return <CariGenelView />;
}
