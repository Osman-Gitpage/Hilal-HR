import type { Metadata } from "next";
import { ProjeDetayView } from "@/components/modules/puantaj/ProjeDetayView";

export const metadata: Metadata = { title: "Proje Detayı" };

export default async function ProjeDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjeDetayView projeId={id} />;
}
