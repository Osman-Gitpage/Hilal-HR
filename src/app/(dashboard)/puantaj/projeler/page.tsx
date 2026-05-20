import type { Metadata } from "next";
import { ProjelerView } from "@/components/modules/puantaj/ProjelerView";

export const metadata: Metadata = { title: "Projeler" };

export default function ProjelerPage() {
  return <ProjelerView />;
}
