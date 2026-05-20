import type { Metadata } from "next";
import { BordroVeriGirisiView } from "@/components/modules/bordro/BordroVeriGirisiView";

export const metadata: Metadata = { title: "Bordro Veri Girişi" };

export default function VeriGirisiPage() {
  return <BordroVeriGirisiView />;
}
