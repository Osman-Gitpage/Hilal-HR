import type { Metadata } from "next";
import { MaasDetayView } from "@/components/modules/bordro/MaasDetayView";

export const metadata: Metadata = { title: "Maaş Detay — Hilal HR" };

export default async function MaasDetayPage({
  params,
}: {
  params: Promise<{ bordroId: string }>;
}) {
  const { bordroId } = await params;
  return <MaasDetayView bordroId={bordroId} />;
}
