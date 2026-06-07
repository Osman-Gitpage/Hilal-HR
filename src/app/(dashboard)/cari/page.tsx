import { BelgeListesiView } from "@/components/modules/cari/BelgeListesiView";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CariPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    }>
      <BelgeListesiView />
    </Suspense>
  );
}
