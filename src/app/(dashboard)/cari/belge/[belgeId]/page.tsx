import type { Metadata } from "next";
import { BelgeDetayView } from "@/components/modules/cari/BelgeDetayView";

export const metadata: Metadata = { title: "Belge Detay — Cari" };

export default function BelgeDetayPage({
  params,
}: {
  params: Promise<{ belgeId: string }>;
}) {
  return <BelgeDetayView paramsPromise={params} />;
}
