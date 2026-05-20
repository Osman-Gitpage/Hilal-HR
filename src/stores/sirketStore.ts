import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Sirket } from "@/supabase/app-types";

interface SirketStore {
  // Aktif şirket
  aktifSirketId: string | null;
  aktifSirket: Sirket | null;

  // Kullanıcının erişebildiği şirketler
  sirketler: Sirket[];

  // Actions
  setAktifSirket: (sirket: Sirket) => void;
  setSirketler: (sirketler: Sirket[]) => void;
  clearSirket: () => void;
}

export const useSirketStore = create<SirketStore>()(
  persist(
    (set) => ({
      aktifSirketId: null,
      aktifSirket: null,
      sirketler: [],

      setAktifSirket: (sirket) =>
        set({ aktifSirket: sirket, aktifSirketId: sirket.id }),

      setSirketler: (sirketler) => set({ sirketler }),

      clearSirket: () =>
        set({ aktifSirket: null, aktifSirketId: null, sirketler: [] }),
    }),
    {
      name: "hilal-hr-sirket",
      // Sadece şirket ID'sini localStorage'da sakla
      partialize: (state) => ({ aktifSirketId: state.aktifSirketId }),
    }
  )
);
