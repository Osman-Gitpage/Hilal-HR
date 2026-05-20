import type { Metadata } from "next";
import { GenelPuantajView } from "@/components/modules/puantaj/GenelPuantajView";

export const metadata: Metadata = { title: "Genel Puantaj" };

export default function PuantajPage() {
  return <GenelPuantajView />;
}
