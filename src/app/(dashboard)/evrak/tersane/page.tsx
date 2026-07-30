import type { Metadata } from "next";
import { TersaneSablonContent } from "@/components/modules/evrak/TersaneSablonContent";

export const metadata: Metadata = { title: "Tersane Şablonları — Hilal Office" };

export default function TersanePage() {
  return <TersaneSablonContent />;
}
