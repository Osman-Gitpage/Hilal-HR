import { create } from "zustand";

interface UIStore {
  // Personel Modal Durumları
  personelEkleAcik: boolean;
  personelDuzenleAcik: boolean;
  seciliPersonelId: string | null;

  // Personel Liste Filtreleri
  personelTab: "aktif" | "arsiv";
  personelArama: string;

  // Bordro
  seciliDonemYil: number;
  seciliDonemAy: number;

  // Sidebar
  sidebarAcik: boolean;

  // Actions
  setPersonelEkleAcik: (acik: boolean) => void;
  setPersonelDuzenleAcik: (acik: boolean, personelId?: string) => void;
  setPersonelTab: (tab: "aktif" | "arsiv") => void;
  setPersonelArama: (arama: string) => void;
  setSeciliDonem: (yil: number, ay: number) => void;
  setSidebarAcik: (acik: boolean) => void;
  toggleSidebar: () => void;
}

const bugun = new Date();

export const useUIStore = create<UIStore>((set) => ({
  personelEkleAcik: false,
  personelDuzenleAcik: false,
  seciliPersonelId: null,

  personelTab: "aktif",
  personelArama: "",

  seciliDonemYil: bugun.getFullYear(),
  seciliDonemAy: bugun.getMonth() + 1,

  sidebarAcik: true,

  setPersonelEkleAcik: (acik) => set({ personelEkleAcik: acik }),

  setPersonelDuzenleAcik: (acik, personelId) =>
    set({
      personelDuzenleAcik: acik,
      seciliPersonelId: acik ? (personelId ?? null) : null,
    }),

  setPersonelTab: (tab) => set({ personelTab: tab }),
  setPersonelArama: (arama) => set({ personelArama: arama }),

  setSeciliDonem: (yil, ay) =>
    set({ seciliDonemYil: yil, seciliDonemAy: ay }),

  setSidebarAcik: (acik) => set({ sidebarAcik: acik }),

  toggleSidebar: () => set((s) => ({ sidebarAcik: !s.sidebarAcik })),
}));
