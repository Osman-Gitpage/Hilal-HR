import { BelgeDetayView } from "@/components/modules/cari/BelgeDetayView";

interface Props {
  params: Promise<{ belgeId: string }>;
}

export default async function BelgeDetayPage({ params }: Props) {
  const { belgeId } = await params;
  return <BelgeDetayView belgeId={belgeId} />;
}
