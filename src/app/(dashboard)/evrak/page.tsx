import type { Metadata } from "next";
import { EvrakContent } from "@/components/modules/evrak/EvrakContent";

export const metadata: Metadata = { title: "Evrak Yönetimi — Hilal HR" };

export default function EvrakPage() {
  return <EvrakContent />;
}
