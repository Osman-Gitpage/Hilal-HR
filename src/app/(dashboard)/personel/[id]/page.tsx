import type { Metadata } from "next";
import { PersonelDetayView } from "@/components/modules/personel/PersonelDetayView";

export const metadata: Metadata = { title: "Personel Detay — Hilal Office" };

export default async function PersonelDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PersonelDetayView personelId={id} />;
}
