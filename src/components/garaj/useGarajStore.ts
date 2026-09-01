import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Arac,
  Police,
  TrafikCezasi,
  AylikYakitKaydi,
  ServisKaydi,
  MuayeneBilgileri,
} from "./types";
import { DUMMY_FILO_ARACLARI } from "./garajData";

const DEFAULT_POLICELER: Police[] = [
  {
    id: "pol-1",
    tur: "Genişletilmiş Kasko Sigortası",
    sirket: "Allianz Sigorta",
    policeNo: "KSK-2024-8849102",
    bitisTarihi: "01.11.2026",
    kalanGun: 194,
    tutar: 24500,
  },
  {
    id: "pol-2",
    tur: "Zorunlu Trafik Sigortası",
    sirket: "Aksigorta",
    policeNo: "TRF-2024-1102948",
    bitisTarihi: "15.01.2027",
    kalanGun: 268,
    tutar: 9800,
  },
];

const DEFAULT_CEZALAR: TrafikCezasi[] = [
  {
    id: "cez-1",
    tarih: "20.08.2026",
    cezaTuru: "Hız İhlali",
    aciklama: "Hız sınırını %10-30 oranında aşmak",
    tutar: 1506,
  },
  {
    id: "cez-2",
    tarih: "10.07.2026",
    cezaTuru: "Park İhlali",
    aciklama: "Yasak park alanında park etmek",
    tutar: 993,
  },
  {
    id: "cez-3",
    tarih: "15.06.2026",
    cezaTuru: "Kırmızı Işık",
    aciklama: "Kırmızı ışık ihlali",
    tutar: 2167,
  },
  {
    id: "cez-4",
    tarih: "05.05.2026",
    cezaTuru: "Emniyet Kemeri",
    aciklama: "Emniyet kemeri takmamak",
    tutar: 436,
  },
];

const DEFAULT_MUAYENE: MuayeneBilgileri = {
  muayeneTarihi: "18.06.2026",
  kalanGun: 126,
  muayeneUcreti: 2620,
  istasyon: "TÜVTÜRK Maslak İstasyonu",
  raporNo: "TUV-2024-991840",
  sonuc: "Kusursuz Geçti",
  egzozEmisyonTarihi: "18.06.2026",
};

const DEFAULT_YAKIT_KAYITLARI: AylikYakitKaydi[] = [
  {
    id: "yk-1",
    yil: 2026,
    ay: "Ocak",
    yakitTuru: "Motorin (Dizel)",
    miktar: 180,
    birimFiyat: 46.5,
    toplamTutar: 8370,
    belgeNo: "TTS-2026-01",
  },
  {
    id: "yk-2",
    yil: 2026,
    ay: "Şubat",
    yakitTuru: "Motorin (Dizel)",
    miktar: 150,
    birimFiyat: 47.2,
    toplamTutar: 7080,
    belgeNo: "TTS-2026-02",
  },
  {
    id: "yk-3",
    yil: 2026,
    ay: "Mart",
    yakitTuru: "Motorin (Dizel)",
    miktar: 190,
    birimFiyat: 48.1,
    toplamTutar: 9139,
    belgeNo: "TTS-2026-03",
  },
];

const DEFAULT_SERVIS_KAYITLARI: ServisKaydi[] = [
  {
    id: "sr-1",
    yil: 2026,
    tarih: "14.07.2026",
    km: 22500,
    islemTuru: "Periyodik Bakım",
    servisAdi: "Borusan Oto Maslak",
    aciklama: "Motor yağı, hava/polen/yakıt filtreleri ve ön fren balata değişimi",
    faturaNo: "FAT-2026-8819",
    tutar: 16500,
  },
  {
    id: "sr-2",
    yil: 2026,
    tarih: "10.04.2026",
    km: 18200,
    islemTuru: "Lastik Değişimi",
    servisAdi: "Maslak Lastik Park",
    aciklama: "4 Adet Yazlık Lastik Montajı & Balans Ayarı",
    faturaNo: "FAT-2026-4412",
    tutar: 3200,
  },
  {
    id: "sr-3",
    yil: 2026,
    tarih: "12.01.2026",
    km: 14800,
    islemTuru: "Akü Değişimi",
    servisAdi: "Bosch Car Service Levent",
    aciklama: "Varta 12V 74Ah AGM Akü Montajı ve Voltaj Kalibrasyonu",
    faturaNo: "FAT-2026-1052",
    tutar: 6800,
  },
];

interface GarajStore {
  araclar: Arac[];
  aracEkle: (arac: Omit<Arac, "id">) => void;
  aracGuncelle: (id: string, arac: Partial<Arac>) => void;
  aracSil: (id: string) => void;
  aracGetir: (id: string) => Arac | undefined;
  policeEkle: (aracId: string, police: Omit<Police, "id">) => void;
  policeSil: (aracId: string, policeId: string) => void;
  cezaEkle: (aracId: string, ceza: Omit<TrafikCezasi, "id">) => void;
  cezaSil: (aracId: string, cezaId: string) => void;
  muayeneGuncelle: (aracId: string, muayene: MuayeneBilgileri) => void;
  yakitKaydiEkle: (aracId: string, kayit: Omit<AylikYakitKaydi, "id">) => void;
  yakitKaydiSil: (aracId: string, kayitId: string) => void;
  servisKaydiEkle: (aracId: string, kayit: Omit<ServisKaydi, "id">) => void;
  servisKaydiSil: (aracId: string, kayitId: string) => void;
  filoyuSifirla: () => void;
}

export const useGarajStore = create<GarajStore>()(
  persist(
    (set, get) => ({
      araclar: [],

      aracEkle: (yeniArac) => {
        const id = `car-${Date.now()}`;
        const tamArac: Arac = {
          ...yeniArac,
          id,
          policeler: DEFAULT_POLICELER,
          cezalar: DEFAULT_CEZALAR,
          muayene: DEFAULT_MUAYENE,
          yakitKayitlari: DEFAULT_YAKIT_KAYITLARI,
          servisKayitlari: DEFAULT_SERVIS_KAYITLARI,
          toplamTuketimYil: yeniArac.toplamTuketimYil || "2026 Yılı Toplam",
          toplamTuketim: yeniArac.toplamTuketim || "1250 LT",
          aylikTuketimler: yeniArac.aylikTuketimler || [
            { ay: "Ocak", miktar: "80 LT" },
            { ay: "Şubat", miktar: "65 LT" },
            { ay: "Mart", miktar: "15 LT" },
          ],
          servisDurumlari: yeniArac.servisDurumlari || [
            { baslik: "Bakım", sonTarih: "15.05.2027", kalanGun: 280, tip: "bakim" },
            { baslik: "Muayene", sonTarih: "20.10.2026", kalanGun: 190, tip: "muayene" },
            { baslik: "Kasko", sonTarih: "10.02.2027", kalanGun: 310, tip: "kasko" },
          ],
          ruhsat: yeniArac.ruhsat || {
            ruhsatSeriNo: `GI ${Math.floor(100000 + Math.random() * 900000)}`,
            motorNo: `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
            saseNo: `NM4263${Math.floor(100000 + Math.random() * 900000)}Y60210`,
          },
        };
        set((state) => ({ araclar: [tamArac, ...state.araclar] }));
      },

      aracGuncelle: (id, guncelVeri) => {
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === id ? { ...a, ...guncelVeri } : a
          ),
        }));
      },

      aracSil: (id) => {
        set((state) => ({
          araclar: state.araclar.filter((a) => a.id !== id),
        }));
      },

      aracGetir: (id) => {
        return get().araclar.find((a) => a.id === id);
      },

      policeEkle: (aracId, policeVerisi) => {
        const id = `pol-${Date.now()}`;
        const yeniPolice: Police = { ...policeVerisi, id };
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === aracId
              ? { ...a, policeler: [...(a.policeler || []), yeniPolice] }
              : a
          ),
        }));
      },

      policeSil: (aracId, policeId) => {
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === aracId
              ? {
                  ...a,
                  policeler: (a.policeler || []).filter((p) => p.id !== policeId),
                }
              : a
          ),
        }));
      },

      cezaEkle: (aracId, cezaVerisi) => {
        const id = `cez-${Date.now()}`;
        const yeniCeza: TrafikCezasi = { ...cezaVerisi, id };
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === aracId
              ? { ...a, cezalar: [yeniCeza, ...(a.cezalar || [])] }
              : a
          ),
        }));
      },

      cezaSil: (aracId, cezaId) => {
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === aracId
              ? {
                  ...a,
                  cezalar: (a.cezalar || []).filter((c) => c.id !== cezaId),
                }
              : a
          ),
        }));
      },

      muayeneGuncelle: (aracId, muayeneVerisi) => {
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === aracId ? { ...a, muayene: muayeneVerisi } : a
          ),
        }));
      },

      yakitKaydiEkle: (aracId, kayit) => {
        const id = `yk-${Date.now()}`;
        const yeniKayit: AylikYakitKaydi = { ...kayit, id };
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === aracId
              ? {
                  ...a,
                  yakitKayitlari: [
                    ...(a.yakitKayitlari || []).filter(
                      (y) => !(y.yil === kayit.yil && y.ay === kayit.ay)
                    ),
                    yeniKayit,
                  ],
                }
              : a
          ),
        }));
      },

      yakitKaydiSil: (aracId, kayitId) => {
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === aracId
              ? {
                  ...a,
                  yakitKayitlari: (a.yakitKayitlari || []).filter(
                    (y) => y.id !== kayitId
                  ),
                }
              : a
          ),
        }));
      },

      servisKaydiEkle: (aracId, kayit) => {
        const id = `sr-${Date.now()}`;
        const yeniKayit: ServisKaydi = { ...kayit, id };
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === aracId
              ? {
                  ...a,
                  servisKayitlari: [yeniKayit, ...(a.servisKayitlari || [])],
                }
              : a
          ),
        }));
      },

      servisKaydiSil: (aracId, kayitId) => {
        set((state) => ({
          araclar: state.araclar.map((a) =>
            a.id === aracId
              ? {
                  ...a,
                  servisKayitlari: (a.servisKayitlari || []).filter(
                    (s) => s.id !== kayitId
                  ),
                }
              : a
          ),
        }));
      },

      filoyuSifirla: () => {
        set({ araclar: DUMMY_FILO_ARACLARI });
      },
    }),
    {
      name: "hilal_garaj_filo_storage_v5",
    }
  )
);
