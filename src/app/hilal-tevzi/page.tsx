"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import ReactDOM from "react-dom";
import {
  FileText,
  Share2,
  RotateCcw,
  Building,
  User,
  Briefcase,
  Loader2,
  Save,
  ClipboardCopy,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PDFDocument, rgb, PDFName } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { saveAs } from "file-saver";
import { format, parseISO, isValid, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { DatePicker } from "@/components/ui/date-picker";
import { usePersonelList } from "@/hooks/usePersonelList";
import { useTevziKaydet, useTevziListesi } from "@/hooks/useTevzi";
import type { TevziSatir, TevziKayit } from "@/hooks/useTevzi";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const TOTAL_ROWS = 25;
const FIXED_PROJE = "8000TLC HAVUZ";
const FIXED_FORMEN = "HARUN TURAN";
const FIXED_FIRMA = "HİLAL İZOLASYON";

// ─── Yardımcı: Bugünün ISO tarihi ────────────────────────────────────────────

function bugunIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// ─── Yardımcı: ISO → PDF formatı (GG/AA/YYYY) ────────────────────────────────

function isoToPdfFormat(iso: string): string {
  try {
    const d = parseISO(iso);
    if (isValid(d)) return format(d, "dd/MM/yyyy");
  } catch {}
  return iso;
}

// ─── Yardımcı: Boş satır dizisi ──────────────────────────────────────────────

function bosaturlar(): TevziSatir[] {
  return Array.from({ length: TOTAL_ROWS }, (_, i) => ({
    no: i + 1,
    adSoyad: "",
    gorev: "",
    calismaAlani: "",
  }));
}

// ─── PersonelAutocomplete Alt Bileşeni ───────────────────────────────────────

interface PersonelOneriItem {
  adSoyad: string;
  gorev: string;
}

interface AdSoyadHucresiProps {
  value: string;
  onneriler: PersonelOneriItem[];
  onChange: (val: string) => void;
  onSelect: (item: PersonelOneriItem) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  inputRef: (el: HTMLInputElement | null) => void;
  placeholder?: string;
}

const AdSoyadHucresi = memo(function AdSoyadHucresi({
  value,
  onneriler,
  onChange,
  onSelect,
  onKeyDown,
  onPaste,
  inputRef,
  placeholder,
}: AdSoyadHucresiProps) {
  const [acik, setAcik] = useState(false);
  const [seciliIndex, setSeciliIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputElRef = useRef<HTMLInputElement | null>(null);

  const filtreliOneriler = useMemo(() => {
    if (!value.trim() || value.length < 1) return [];
    const kucuk = value.toLowerCase();
    return onneriler
      .filter((o) => o.adSoyad.toLowerCase().includes(kucuk))
      .slice(0, 6);
  }, [value, onneriler]);

  // Dropdown pozisyonunu input'un altına sabitle (fixed)
  const konumGuncelle = useCallback(() => {
    if (!inputElRef.current) return;
    const rect = inputElRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 220),
    });
  }, []);

  // Dış tıklama → kapat
  useEffect(() => {
    function kapat(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !(target as Element).closest?.("[data-tevzi-dropdown]")
      ) {
        setAcik(false);
      }
    }
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, []);

  // Scroll/resize'da pozisyonu güncelle
  useEffect(() => {
    if (!acik) return;
    window.addEventListener("scroll", konumGuncelle, true);
    window.addEventListener("resize", konumGuncelle);
    return () => {
      window.removeEventListener("scroll", konumGuncelle, true);
      window.removeEventListener("resize", konumGuncelle);
    };
  }, [acik, konumGuncelle]);

  useEffect(() => {
    if (filtreliOneriler.length > 0) {
      konumGuncelle();
      setAcik(true);
    } else {
      setAcik(false);
    }
    setSeciliIndex(0);
  }, [filtreliOneriler.length, konumGuncelle]);

  function handleKeyDownInner(e: React.KeyboardEvent<HTMLInputElement>) {
    if (acik && filtreliOneriler.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSeciliIndex((i) => Math.min(i + 1, filtreliOneriler.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSeciliIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onSelect(filtreliOneriler[seciliIndex]);
        setAcik(false);
        return;
      }
      if (e.key === "Escape") {
        setAcik(false);
        return;
      }
    }
    onKeyDown(e);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={(el) => {
          inputElRef.current = el;
          inputRef(el);
        }}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDownInner}
        onPaste={onPaste}
        onFocus={() => { if (filtreliOneriler.length > 0) { konumGuncelle(); setAcik(true); } }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full h-9 px-2 sm:px-3 bg-transparent outline-none font-semibold text-neutral-900 focus:bg-amber-50 focus:ring-1 focus:ring-inset focus:ring-blue-500 text-xs sm:text-sm"
      />
      {/* Fixed portal dropdown — tablo overflow kısıtlamasının dışında */}
      {acik && filtreliOneriler.length > 0 && typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <ul
            data-tevzi-dropdown
            className="fixed z-[500] bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden text-xs"
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, minWidth: 220 }}
          >
            {filtreliOneriler.map((o, i) => (
              <li
                key={o.adSoyad + i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(o);
                  setAcik(false);
                }}
                className={`px-3 py-2.5 cursor-pointer flex flex-col gap-0.5 ${
                  i === seciliIndex ? "bg-blue-50 text-blue-700" : "hover:bg-neutral-50 text-neutral-800"
                }`}
              >
                <span className="font-semibold">{o.adSoyad}</span>
                {o.gorev && <span className="text-neutral-400 text-[10px]">{o.gorev}</span>}
              </li>
            ))}
          </ul>,
          document.body
        )
      }
    </div>
  );
});

// ─── CalismaAlaniHucresi (Excel-stili sütun autocomplete) ────────────────────

interface CalismaAlaniHucresiProps {
  value: string;
  sutunDegerleri: string[];  // O güne kadar yazılan diğer satırların değerleri
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  inputRef: (el: HTMLInputElement | null) => void;
  placeholder?: string;
}

const CalismaAlaniHucresi = memo(function CalismaAlaniHucresi({
  value,
  sutunDegerleri,
  onChange,
  onKeyDown,
  onPaste,
  inputRef,
  placeholder,
}: CalismaAlaniHucresiProps) {
  const [acik, setAcik] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputElRef = useRef<HTMLInputElement | null>(null);

  const benzersizDegerler = useMemo(() => {
    const set = new Set(sutunDegerleri.filter((d) => d.trim().length > 0));
    return Array.from(set);
  }, [sutunDegerleri]);

  const filtreliOneriler = useMemo(() => {
    if (!value.trim() || value.length < 1) return [];
    const kucuk = value.toLowerCase();
    return benzersizDegerler
      .filter((d) => d.toLowerCase().startsWith(kucuk) && d.toLowerCase() !== kucuk)
      .slice(0, 5);
  }, [value, benzersizDegerler]);

  const konumGuncelle = useCallback(() => {
    if (!inputElRef.current) return;
    const rect = inputElRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 180),
    });
  }, []);

  useEffect(() => {
    function kapat(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !(target as Element).closest?.("[data-tevzi-dropdown]")
      ) {
        setAcik(false);
      }
    }
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, []);

  useEffect(() => {
    if (!acik) return;
    window.addEventListener("scroll", konumGuncelle, true);
    window.addEventListener("resize", konumGuncelle);
    return () => {
      window.removeEventListener("scroll", konumGuncelle, true);
      window.removeEventListener("resize", konumGuncelle);
    };
  }, [acik, konumGuncelle]);

  useEffect(() => {
    if (filtreliOneriler.length > 0) {
      konumGuncelle();
      setAcik(true);
    } else {
      setAcik(false);
    }
  }, [filtreliOneriler.length, konumGuncelle]);

  function handleKeyDownInner(e: React.KeyboardEvent<HTMLInputElement>) {
    if (acik && filtreliOneriler.length > 0) {
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        onChange(filtreliOneriler[0]);
        setAcik(false);
        return;
      }
      if (e.key === "Escape") {
        setAcik(false);
        return;
      }
    }
    onKeyDown(e);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={(el) => {
          inputElRef.current = el;
          inputRef(el);
        }}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDownInner}
        onPaste={onPaste}
        onFocus={() => { if (filtreliOneriler.length > 0) { konumGuncelle(); setAcik(true); } }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full h-9 px-2 sm:px-3 bg-transparent outline-none text-neutral-800 focus:bg-amber-50 focus:ring-1 focus:ring-inset focus:ring-blue-500 text-xs sm:text-sm"
      />
      {acik && filtreliOneriler.length > 0 && typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <ul
            data-tevzi-dropdown
            className="fixed z-[500] bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden text-xs"
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          >
            {filtreliOneriler.map((d, i) => (
              <li
                key={d + i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(d);
                  setAcik(false);
                }}
                className={`px-3 py-2.5 cursor-pointer ${
                  i === 0 ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-neutral-50 text-neutral-800"
                }`}
              >
                {d}
              </li>
            ))}
          </ul>,
          document.body
        )
      }
    </div>
  );
});

// ─── Custom Drawer (Sheet alternatifi — Portal tabanlı) ──────────────────────

interface DrawerProps {
  acik: boolean;
  onKapat: () => void;
  side?: "right" | "bottom";
  children: React.ReactNode;
}

function Drawer({ acik, onKapat, side = "right", children }: DrawerProps) {
  // ESC ile kapat
  useEffect(() => {
    if (!acik) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onKapat();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [acik, onKapat]);

  // Scroll kilidi
  useEffect(() => {
    if (acik) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [acik]);

  if (!acik) return null;

  const panelClass =
    side === "bottom"
      ? "fixed bottom-0 left-0 right-0 z-[200] bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col animate-slide-up"
      : "fixed top-0 right-0 bottom-0 z-[200] bg-white w-80 sm:w-96 shadow-2xl flex flex-col animate-slide-right overflow-y-auto";

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[199] bg-black/30 backdrop-blur-xs"
        onClick={onKapat}
      />
      {/* Panel */}
      <div className={panelClass}>
        <button
          type="button"
          onClick={onKapat}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </>
  );
}

// ─── Geçmiş Paneli ───────────────────────────────────────────────────────────

interface GecmisPaneliProps {
  liste: TevziKayit[];
  yukleniyor: boolean;
  onYukle: (kayit: TevziKayit) => void;
}

function GecmisPaneli({ liste, yukleniyor, onYukle }: GecmisPaneliProps) {
  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Yükleniyor...
      </div>
    );
  }

  if (liste.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400 text-sm">
        Henüz kayıt bulunmuyor.
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      {liste.map((kayit) => {
        const tarihGoster = (() => {
          try {
            const d = parseISO(kayit.tarih);
            return isValid(d) ? format(d, "d MMMM yyyy, EEEE", { locale: tr }) : kayit.tarih;
          } catch { return kayit.tarih; }
        })();
        const doluSayisi = (kayit.satirlar as TevziSatir[]).filter(
          (r) => r.adSoyad.trim() !== ""
        ).length;

        return (
          <div
            key={kayit.id}
            className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-colors gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">{tarihGoster}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {doluSayisi} personel
              </p>
            </div>
            <button
              type="button"
              onClick={() => onYukle(kayit)}
              className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Yükle
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function HilalTevziPage() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [docDateIso, setDocDateIso] = useState<string>(bugunIso());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [gecmisPaneliAcik, setGecmisPaneliAcik] = useState(false);

  const [rows, setRows] = useState<TevziSatir[]>(() => bosaturlar());

  // ─── Refs ────────────────────────────────────────────────────────────────────
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const cachedTemplateRef = useRef<ArrayBuffer | null>(null);
  const cachedFontRef = useRef<ArrayBuffer | null>(null);

  // ─── Hooks ──────────────────────────────────────────────────────────────────
  const { data: personelListesi = [] } = usePersonelList();
  const { data: gecmisListe = [], isLoading: gecmisYukleniyor } = useTevziListesi();
  const { mutate: kaydetMutate, isPending: kaydediliyor } = useTevziKaydet();

  // ─── Personel Önerileri (Supabase'den) ──────────────────────────────────────
  const personelOnerileri = useMemo<PersonelOneriItem[]>(() => {
    return personelListesi.map((p) => ({
      adSoyad: `${p.ad} ${p.soyad}`,
      gorev: p.gorev_unvan ?? "",
    }));
  }, [personelListesi]);

  // ─── Çalışma Alanı Sütun Değerleri ──────────────────────────────────────────
  const calismaAlaniSutunu = useMemo(
    () => rows.map((r) => r.calismaAlani),
    [rows]
  );

  // ─── PDF Önbellek Yükleme ────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/hilal-tevzi-sablon.pdf")
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => { if (b) cachedTemplateRef.current = b; })
      .catch(() => {});
    fetch("/fonts/TimesNewRoman.ttf")
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => { if (b) cachedFontRef.current = b; })
      .catch(() => {});
  }, []);

  // ─── Sayfa açılışında bugünün kaydını yükle ──────────────────────────────────
  const ilkYuklemeTamamlandi = useRef(false);

  useEffect(() => {
    if (gecmisListe.length === 0) return;
    if (ilkYuklemeTamamlandi.current) return; // zaten yapıldı
    ilkYuklemeTamamlandi.current = true;

    const bugunKayit = gecmisListe.find((k) => k.tarih === bugunIso());
    if (bugunKayit) {
      const yuklenecek = bosaturlar();
      (bugunKayit.satirlar as TevziSatir[]).forEach((s, i) => {
        if (i < TOTAL_ROWS) yuklenecek[i] = { ...s, no: i + 1 };
      });
      setRows(yuklenecek);
    }
  }, [gecmisListe]);

  // ─── Tarih değişince o tarihin kaydını yükle (yoksa boş) ─────────────────────
  useEffect(() => {
    // İlk yükleme henüz tamamlanmadıysa müdahale etme
    if (!ilkYuklemeTamamlandi.current) return;

    const kayit = gecmisListe.find((k) => k.tarih === docDateIso);
    if (kayit) {
      const yuklenecek = bosaturlar();
      (kayit.satirlar as TevziSatir[]).forEach((s, i) => {
        if (i < TOTAL_ROWS) yuklenecek[i] = { ...s, no: i + 1 };
      });
      setRows(yuklenecek);
      toast.info("Bu tarihe ait kayıt yüklendi.");
    } else {
      setRows(bosaturlar());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docDateIso]);

  // ─── Hücre Güncelleme ────────────────────────────────────────────────────────
  const handleCellChange = useCallback(
    (index: number, field: keyof Omit<TevziSatir, "no">, value: string) => {
      setRows((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  // ─── Personel Seç → adSoyad + gorev otodoldur ───────────────────────────────
  const handlePersonelSec = useCallback(
    (index: number, item: PersonelOneriItem) => {
      setRows((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          adSoyad: item.adSoyad,
          // gorev otomatik doldurulmaz — kullanıcı kendisi girer
        };
        return updated;
      });
      // Görevi sütununa odaklan
      setTimeout(() => {
        cellRefs.current[`${index}-gorev`]?.focus();
      }, 50);
    },
    []
  );

  // ─── Klavye Navigasyonu ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      rowIndex: number,
      field: "adSoyad" | "gorev" | "calismaAlani"
    ) => {
      const fields: ("adSoyad" | "gorev" | "calismaAlani")[] = [
        "adSoyad",
        "gorev",
        "calismaAlani",
      ];
      const fieldIndex = fields.indexOf(field);

      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        if (rowIndex < TOTAL_ROWS - 1) {
          cellRefs.current[`${rowIndex + 1}-${field}`]?.focus();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (rowIndex > 0) {
          cellRefs.current[`${rowIndex - 1}-${field}`]?.focus();
        }
      } else if (e.key === "Tab" && !e.shiftKey) {
        if (fieldIndex === fields.length - 1 && rowIndex < TOTAL_ROWS - 1) {
          e.preventDefault();
          cellRefs.current[`${rowIndex + 1}-${fields[0]}`]?.focus();
        }
      } else if (e.key === "Tab" && e.shiftKey) {
        if (fieldIndex === 0 && rowIndex > 0) {
          e.preventDefault();
          cellRefs.current[`${rowIndex - 1}-${fields[fields.length - 1]}`]?.focus();
        }
      }
    },
    []
  );

  // ─── Excel Toplu Yapıştır ────────────────────────────────────────────────────
  const handlePaste = useCallback(
    (
      e: React.ClipboardEvent<HTMLInputElement>,
      startRowIndex: number,
      startField: "adSoyad" | "gorev" | "calismaAlani"
    ) => {
      const pasteData = e.clipboardData.getData("text");
      if (!pasteData || (!pasteData.includes("\t") && !pasteData.includes("\n"))) return;
      e.preventDefault();
      const pasteRows = pasteData.split(/\r?\n/).filter((r) => r.length > 0);
      const fields: ("adSoyad" | "gorev" | "calismaAlani")[] = [
        "adSoyad",
        "gorev",
        "calismaAlani",
      ];
      const startColIndex = fields.indexOf(startField);

      setRows((prev) => {
        const next = [...prev];
        pasteRows.forEach((rowText, rOffset) => {
          const targetRow = startRowIndex + rOffset;
          if (targetRow < TOTAL_ROWS) {
            const cols = rowText.split("\t");
            cols.forEach((colVal, cOffset) => {
              const targetColIndex = startColIndex + cOffset;
              if (targetColIndex < fields.length) {
                next[targetRow] = {
                  ...next[targetRow],
                  [fields[targetColIndex]]: colVal.trim(),
                };
              }
            });
          }
        });
        return next;
      });
      toast.success("Excel verileri hücrelere aktarıldı.");
    },
    []
  );

  // ─── Tabloyu Temizle ────────────────────────────────────────────────────────
  const handleClearTable = useCallback(() => {
    if (window.confirm("Tablodaki tüm personel verileri temizlensin mi?")) {
      setRows(bosaturlar());
      toast.info("Tablo temizlendi.");
    }
  }, []);

  // ─── Supabase'e Kaydet ───────────────────────────────────────────────────────
  const handleKaydet = useCallback(() => {
    if (filledCount === 0) {
      toast.warning("Kaydedilecek personel verisi yok.");
      return;
    }
    kaydetMutate(
      { tarih: docDateIso, satirlar: rows },
      {
        onSuccess: () => toast.success("Tevzi listesi kaydedildi."),
        onError: (err) => toast.error(err.message || "Kayıt sırasında hata oluştu."),
      }
    );
  }, [kaydetMutate, docDateIso, rows]);

  // ─── Dünkü Listeyi Tekrarla ──────────────────────────────────────────────────
  const handleDunuTekrarla = useCallback(() => {
    const bugun = bugunIso();
    // Bugün hariç en son kaydı bul
    const onceki = gecmisListe.find((k) => k.tarih < bugun);
    if (!onceki) {
      toast.info("Önceki gün kaydı bulunamadı.");
      return;
    }
    const yuklenecek = bosaturlar();
    (onceki.satirlar as TevziSatir[]).forEach((s, i) => {
      if (i < TOTAL_ROWS) yuklenecek[i] = { ...s, no: i + 1 };
    });
    setRows(yuklenecek);
    toast.success(
      `${format(parseISO(onceki.tarih), "d MMMM", { locale: tr })} listesi yüklendi. Tarih bugüne ayarlandı.`
    );
  }, [gecmisListe]);

  // ─── Geçmişten Yükle ────────────────────────────────────────────────────────
  const handleGecmistenYukle = useCallback(
    (kayit: TevziKayit) => {
      const yuklenecek = bosaturlar();
      (kayit.satirlar as TevziSatir[]).forEach((s, i) => {
        if (i < TOTAL_ROWS) yuklenecek[i] = { ...s, no: i + 1 };
      });
      setRows(yuklenecek);
      setGecmisPaneliAcik(false);
      toast.success(
        `${format(parseISO(kayit.tarih), "d MMMM", { locale: tr })} listesi yüklendi.`
      );
    },
    []
  );

  // ─── PDF Oluştur + Paylaş ────────────────────────────────────────────────────
  const handleSendMail = async () => {
    if (filledCount === 0) {
      toast.warning("Lütfen en az bir personel bilgisi girin.");
      return;
    }
    try {
      setIsGeneratingPdf(true);
      toast.loading("PDF hazırlanıyor...", { id: "mail-toast" });

      let templateBytes = cachedTemplateRef.current;
      if (!templateBytes) {
        const tRes = await fetch("/hilal-tevzi-sablon.pdf");
        if (tRes.ok) templateBytes = await tRes.arrayBuffer();
      }
      if (!templateBytes) {
        throw new Error("Şablon PDF dosyası bulunamadı.");
      }

      let fontBytes = cachedFontRef.current;
      if (!fontBytes) {
        const fRes = await fetch("/fonts/TimesNewRoman.ttf");
        if (fRes.ok) fontBytes = await fRes.arrayBuffer();
      }

      const pdfDoc = await PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit);

      let customFont = null;
      if (fontBytes) customFont = await pdfDoc.embedFont(fontBytes);

      const form = pdfDoc.getForm();

      // Tarih alanı
      try {
        const tarihField = form.getTextField("tarih");
        tarihField.setText(isoToPdfFormat(docDateIso));
        if (customFont) tarihField.updateAppearances(customFont);
      } catch {}

      // 25 satır
      for (let i = 1; i <= TOTAL_ROWS; i++) {
        const row = rows[i - 1];
        const adSoyadVal = row?.adSoyad?.trim() ?? "";
        const gorevVal = row?.gorev?.trim() ?? "";
        const calismaVal = row?.calismaAlani?.trim() ?? "";
        try {
          const f = form.getTextField(`ad_soyad_${i}`);
          f.setText(adSoyadVal);
          if (customFont) f.updateAppearances(customFont);
        } catch {}
        try {
          const f = form.getTextField(`gorev_${i}`);
          f.setText(gorevVal);
          if (customFont) f.updateAppearances(customFont);
        } catch {}
        try {
          const f = form.getTextField(`calisma_alani_${i}`);
          f.setText(calismaVal);
          if (customFont) f.updateAppearances(customFont);
        } catch {}
      }

      // Border temizle
      for (const field of form.getFields()) {
        try {
          for (const widget of (field as any).acroField?.getWidgets?.() ?? []) {
            const bs = widget.getOrCreateBorderStyle();
            bs.setWidth(0);
            const app = widget.getOrCreateAppearanceCharacteristics();
            app?.dict?.delete(PDFName.of("BC"));
            app?.dict?.delete(PDFName.of("BG"));
          }
        } catch {}
      }

      form.flatten({ updateFieldAppearances: false });
      const pdfBytes = await pdfDoc.save({ updateFieldAppearances: false });
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

      const cleanDate = isoToPdfFormat(docDateIso).replace(/[/\\?%*:|"<>]/g, ".");
      const fileName = `Hilal ${cleanDate}.pdf`;
      const mailSubject = `Hilal Tevzi ${isoToPdfFormat(docDateIso)}`;
      const pdfFile = new File([blob], fileName, { type: "application/pdf" });

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({ title: mailSubject, files: [pdfFile] });
            toast.success("Paylaşım menüsü açıldı.", { id: "mail-toast" });
            return;
          } else {
            saveAs(blob, fileName);
            await navigator.share({ title: mailSubject, text: `${mailSubject} formu ektedir.` });
            toast.success("PDF indirildi ve paylaşım menüsü açıldı.", { id: "mail-toast" });
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === "AbortError") { toast.dismiss("mail-toast"); return; }
        }
      }

      saveAs(blob, fileName);
      toast.success(`${fileName} indirildi.`, { id: "mail-toast" });
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.", { id: "mail-toast" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ─── Türev Hesaplar ───────────────────────────────────────────────────────────
  const filledCount = rows.filter((r) => r.adSoyad.trim() !== "").length;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 pb-28 sm:pb-12 pt-3 sm:pt-6 px-2 sm:px-6 antialiased">
      <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">

        {/* Üst Başlık & Kontrol Çubuğu */}
        <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 truncate">
                Hilal Tevzi Formu
              </h1>
              <p className="text-[11px] sm:text-xs text-neutral-500">
                Dolu:{" "}
                <span className="font-bold text-blue-600">{filledCount} / 25</span>
              </p>
            </div>
          </div>

          {/* Masaüstü Butonlar */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={handleDunuTekrarla}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
              title="Önceki günün listesini yükle"
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
              <span>Dünü Tekrarla</span>
            </button>

            <button
              type="button"
              onClick={() => setGecmisPaneliAcik(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Geçmiş</span>
            </button>

            <button
              type="button"
              onClick={handleClearTable}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Temizle</span>
            </button>

            <button
              type="button"
              onClick={handleKaydet}
              disabled={kaydediliyor}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {kaydediliyor ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Kaydet</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleSendMail}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isGeneratingPdf ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Hazırlanıyor...</span></>
              ) : (
                <><Share2 className="w-3.5 h-3.5" /><span>Paylaş</span></>
              )}
            </button>
          </div>

          {/* Mobil: sadece Kaydet + Paylaş küçük ikonlar */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={handleKaydet}
              disabled={kaydediliyor}
              className="p-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 transition-colors cursor-pointer"
              title="Kaydet"
            >
              {kaydediliyor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleSendMail}
              className="p-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors cursor-pointer"
              title="Paylaş"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Ana Belge */}
        <div className="bg-white rounded-xl shadow-xs border border-neutral-300 p-3 sm:p-7">

          {/* Başlık */}
          <div className="text-center pb-3 border-b-2 border-neutral-800 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-2xl font-black tracking-wider text-neutral-900 uppercase">
              PERSONEL GÜNLÜK TAKİP FORMU
            </h2>
          </div>

          {/* Meta Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mb-4 sm:mb-6">
            {/* Sol */}
            <div className="space-y-2">
              <div className="flex border border-neutral-300 rounded-lg overflow-hidden bg-white">
                <span className="w-24 sm:w-32 bg-neutral-100 px-2.5 py-2 font-bold text-neutral-600 text-xs flex items-center gap-1 border-r border-neutral-300 shrink-0">
                  <Building className="w-3 h-3 text-neutral-500" />
                  PROJE
                </span>
                <span className="px-2.5 py-2 font-semibold text-neutral-800 flex-1 truncate">
                  {FIXED_PROJE}
                </span>
              </div>
              <div className="flex border border-neutral-300 rounded-lg overflow-hidden bg-white">
                <span className="w-24 sm:w-32 bg-neutral-100 px-2.5 py-2 font-bold text-neutral-600 text-xs flex items-center gap-1 border-r border-neutral-300 shrink-0">
                  <User className="w-3 h-3 text-neutral-500" />
                  FORMEN
                </span>
                <span className="px-2.5 py-2 font-semibold text-neutral-800 flex-1 truncate">
                  {FIXED_FORMEN}
                </span>
              </div>
            </div>

            {/* Sağ */}
            <div className="space-y-2">
              {/* Date Picker */}
              <div className="flex border-2 border-blue-500 rounded-lg overflow-hidden bg-white shadow-xs">
                <span className="w-24 sm:w-36 bg-blue-50 px-2.5 py-1.5 font-bold text-blue-900 text-xs flex items-center gap-1 border-r border-blue-200 shrink-0">
                  TARİH
                </span>
                <div className="flex-1 px-1 py-0.5">
                  <DatePicker
                    value={docDateIso}
                    onChange={(iso) => { if (iso) setDocDateIso(iso); }}
                    clearable={false}
                    placeholder="GG.AA.YYYY"
                    className="border-0 shadow-none"
                  />
                </div>
              </div>
              <div className="flex border border-neutral-300 rounded-lg overflow-hidden bg-white">
                <span className="w-24 sm:w-36 bg-neutral-100 px-2.5 py-2 font-bold text-neutral-600 text-xs flex items-center gap-1 border-r border-neutral-300 shrink-0">
                  <Briefcase className="w-3 h-3 text-neutral-500" />
                  FİRMA / İŞ
                </span>
                <span className="px-2.5 py-2 font-semibold text-neutral-800 flex-1 truncate">
                  {FIXED_FIRMA}
                </span>
              </div>
            </div>
          </div>

          {/* Tablo */}
          <div className="border border-neutral-400 rounded-lg overflow-x-auto shadow-2xs relative">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[520px]">
              <thead>
                <tr className="bg-neutral-200 text-neutral-800 border-b border-neutral-400 font-bold uppercase select-none">
                  <th className="w-9 text-center py-2 px-1 border-r border-neutral-400">NO</th>
                  <th className="py-2 px-2.5 border-r border-neutral-400 min-w-[140px] sm:min-w-[200px] sticky left-0 z-20 bg-neutral-200 shadow-[2px_0_4px_rgba(0,0,0,0.06)]">
                    AD SOYAD
                  </th>
                  <th className="py-2 px-2 border-r border-neutral-400 min-w-[110px] sm:w-1/4">GÖREVİ</th>
                  <th className="py-2 px-2 border-r border-neutral-400 min-w-[110px] sm:w-1/4">ÇALIŞMA ALANI</th>
                  <th className="py-2 px-1 text-center w-12">İMZA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.no}
                    className={`border-b border-neutral-300 transition-colors ${
                      index % 2 === 1 ? "bg-neutral-50/70" : "bg-white"
                    } hover:bg-blue-50/30`}
                  >
                    {/* NO */}
                    <td className="text-center font-bold text-neutral-500 py-0 px-1 border-r border-neutral-300 bg-neutral-100 select-none text-xs">
                      {row.no}
                    </td>

                    {/* AD SOYAD — Autocomplete */}
                    <td
                      className={`p-0 border-r border-neutral-300 sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)] ${
                        index % 2 === 1 ? "bg-neutral-50" : "bg-white"
                      }`}
                    >
                      <AdSoyadHucresi
                        value={row.adSoyad}
                        onneriler={personelOnerileri}
                        onChange={(val) => handleCellChange(index, "adSoyad", val)}
                        onSelect={(item) => handlePersonelSec(index, item)}
                        onKeyDown={(e) => handleKeyDown(e, index, "adSoyad")}
                        onPaste={(e) => handlePaste(e, index, "adSoyad")}
                        inputRef={(el) => { cellRefs.current[`${index}-adSoyad`] = el; }}
                        placeholder={index === 0 ? "Ad Soyad..." : ""}
                      />
                    </td>

                    {/* GÖREVİ */}
                    <td className="p-0 border-r border-neutral-300">
                      <input
                        ref={(el) => { cellRefs.current[`${index}-gorev`] = el; }}
                        type="text"
                        value={row.gorev}
                        onChange={(e) => handleCellChange(index, "gorev", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "gorev")}
                        onPaste={(e) => handlePaste(e, index, "gorev")}
                        placeholder={index === 0 ? "Görevi..." : ""}
                        className="w-full h-9 px-2 sm:px-3 bg-transparent outline-none text-neutral-800 focus:bg-amber-50 focus:ring-1 focus:ring-inset focus:ring-blue-500 text-xs sm:text-sm"
                      />
                    </td>

                    {/* ÇALIŞMA ALANI — Sütun Autocomplete */}
                    <td className="p-0 border-r border-neutral-300">
                      <CalismaAlaniHucresi
                        value={row.calismaAlani}
                        sutunDegerleri={calismaAlaniSutunu.filter((_, i) => i !== index)}
                        onChange={(val) => handleCellChange(index, "calismaAlani", val)}
                        onKeyDown={(e) => handleKeyDown(e, index, "calismaAlani")}
                        onPaste={(e) => handlePaste(e, index, "calismaAlani")}
                        inputRef={(el) => { cellRefs.current[`${index}-calismaAlani`] = el; }}
                        placeholder={index === 0 ? "Çalışma alanı..." : ""}
                      />
                    </td>

                    {/* İMZA */}
                    <td className="py-1 px-1 text-center text-neutral-300 select-none text-[11px]">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alt: Firma Kaşe */}
          <div className="mt-6 sm:mt-8 flex justify-center sm:justify-end">
            <div className="w-full sm:w-72 border-2 border-neutral-300 rounded-lg p-3 sm:p-4 text-center bg-neutral-50/50 space-y-8 sm:space-y-12">
              <div>
                <p className="text-[11px] sm:text-xs font-extrabold tracking-wider text-neutral-700 uppercase">
                  FİRMA YETKİLİSİ
                </p>
                <p className="text-xs sm:text-sm font-black text-neutral-900 mt-0.5">
                  {FIXED_FIRMA}
                </p>
              </div>
              <div className="border-t border-dashed border-neutral-300 pt-1 text-[11px] text-neutral-400">
                Kaşe / İmza
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobil Alt Çubuk */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-neutral-200 z-50 shadow-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center gap-2 p-2.5 px-3">
          <button
            type="button"
            onClick={handleDunuTekrarla}
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg shrink-0 cursor-pointer"
            title="Dünü Tekrarla"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setGecmisPaneliAcik(true)}
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg shrink-0 cursor-pointer"
            title="Geçmiş"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleClearTable}
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleSendMail}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-sm cursor-pointer min-h-[44px]"
          >
            {isGeneratingPdf ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Hazırlanıyor...</span></>
            ) : (
              <><Share2 className="w-3.5 h-3.5" /><span>Paylaş ({filledCount}/25)</span></>
            )}
          </button>
        </div>
      </div>

      {/* Geçmiş Drawer — Portal gibi fixed overlay, sayfanın dışında render */}
      <Drawer
        acik={gecmisPaneliAcik}
        onKapat={() => setGecmisPaneliAcik(false)}
        side={typeof window !== "undefined" && window.innerWidth < 640 ? "bottom" : "right"}
      >
        <div className="p-4 border-b border-neutral-100">
          <p className="text-base font-semibold text-neutral-900">Geçmiş Tevzi Kayıtları</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <GecmisPaneli
            liste={gecmisListe}
            yukleniyor={gecmisYukleniyor}
            onYukle={handleGecmistenYukle}
          />
        </div>
      </Drawer>
    </div>
  );
}
