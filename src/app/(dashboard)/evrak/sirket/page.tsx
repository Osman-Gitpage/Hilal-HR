import type { Metadata } from "next";
import { SirketEvrakContent } from "@/components/modules/evrak/SirketEvrakContent";

export const metadata: Metadata = { title: "Şirket Evrakları — Hilal HR" };

export default function SirketEvrakPage() {
  return <SirketEvrakContent />;
}
