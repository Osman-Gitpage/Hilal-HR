import type { Metadata } from "next";
import { BelgeListesiView } from "@/components/modules/cari/BelgeListesiView";

export const metadata: Metadata = { title: "Cari — Belgeler" };

export default function CariPage() {
  return <BelgeListesiView />;
}
