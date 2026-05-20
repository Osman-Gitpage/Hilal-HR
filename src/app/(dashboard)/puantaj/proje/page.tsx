import type { Metadata } from "next";
import { ProjePuantajView } from "@/components/modules/puantaj/ProjePuantajView";

export const metadata: Metadata = { title: "Proje Puantaj" };

export default function ProjePuantajPage() {
  return <ProjePuantajView />;
}
