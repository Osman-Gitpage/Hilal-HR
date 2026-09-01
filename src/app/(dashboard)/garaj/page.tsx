import { aracListesiGetir } from "@/app/actions/garaj";
import { GarajFiloGorunumu } from "@/components/garaj/GarajFiloGorunumu";

export const dynamic = "force-dynamic";

export default async function GarajPage() {
  const araclar = await aracListesiGetir();

  return <GarajFiloGorunumu baslangicAraclar={araclar} />;
}
