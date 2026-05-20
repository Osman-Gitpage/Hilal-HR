import type { Metadata } from "next";
import { BankaOdemeView } from "@/components/modules/bordro/BankaOdemeView";

export const metadata: Metadata = { title: "Banka Ödeme" };

export default function BankaPage() {
  return <BankaOdemeView />;
}
