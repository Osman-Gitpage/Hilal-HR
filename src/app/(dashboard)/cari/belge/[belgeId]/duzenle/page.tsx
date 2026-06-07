import { BelgeFormView } from "@/components/modules/cari/BelgeFormView";

interface Props {
  params: Promise<{ belgeId: string }>;
}

export default async function BelgeDuzenlemePage({ params }: Props) {
  const { belgeId } = await params;
  return <BelgeFormView belgeId={belgeId} />;
}
