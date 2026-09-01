import { notFound } from "next/navigation";
import { aracDetayGetir } from "@/app/actions/garaj";
import { GarajDetayEkrani } from "@/components/garaj/GarajDetayEkrani";

interface GarajDetayPageProps {
  params: Promise<{ id: string }>;
}

export default async function GarajDetayPage({ params }: GarajDetayPageProps) {
  const { id } = await params;
  const arac = await aracDetayGetir(id);

  if (!arac) {
    notFound();
  }

  return <GarajDetayEkrani arac={arac} />;
}
