import { FirmaListesiView } from "@/components/modules/cari/FirmaListesiView";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FirmaPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <FirmaListesiView />
    </Suspense>
  );
}
