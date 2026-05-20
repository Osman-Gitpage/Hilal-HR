import type { Metadata } from "next";
import { GemiDetayView } from "@/components/modules/cari/GemiDetayView";

export const metadata: Metadata = { title: "Gemi Detay — Cari" };

export default function GemiDetayPage({
  params,
}: {
  params: Promise<{ gemiId: string }>;
}) {
  return <GemiDetayView paramsPromise={params} />;
}
