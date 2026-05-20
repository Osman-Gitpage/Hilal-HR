import type { Metadata } from "next";
import { MaasListesiView } from "@/components/modules/bordro/MaasListesiView";

export const metadata: Metadata = { title: "Maaş Listesi" };

export default function BordroPage() {
  return <MaasListesiView />;
}
