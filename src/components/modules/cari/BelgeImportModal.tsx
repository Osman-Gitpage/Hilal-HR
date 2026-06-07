"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Upload, Download, FileSpreadsheet, CheckCircle2,
  XCircle, Loader2, ChevronRight, AlertTriangle, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  belgeBulkImport,
  type ImportSatir,
  type ImportSonuc,
} from "@/app/actions/cari";
import { useInvalidateCari } from "@/hooks/useCari";

// ─── Şablon Sütunları ─────────────────────────────────────────────────────────

const SUTUNLAR = [
  "Belge No",
  "Tarih (YYYY-AA-GG)",
  "Vade Tarihi (YYYY-AA-GG)",
  "Tür (fatura/proforma/hesap_bilgisi)",
  "Firma Adı",
  "Gemi Adı",
  "Tutar",
  "Para Birimi (TRY/EUR/USD)",
  "Kur",
  "Açıklama",
] as const;

const ORNEK_SATIRLAR = [
  [
    "FTR-2024-001",
    "2024-01-15",
    "2024-02-15",
    "fatura",
    "ABC Lojistik Ltd.",
    "M/V ATLANTIC STAR",
    25000,
    "TRY",
    1,
    "Ocak hizmet bedeli",
  ],
  [
    "FTR-2024-002",
    "2024-01-20",
    "",
    "proforma",
    "XYZ Shipping",
    "M/V OCEAN QUEEN",
    1500,
    "EUR",
    32.5,
    "Navlun teklifi",
  ],
  [
    "FTR-2024-003",
    "2024-01-25",
    "2024-03-01",
    "hesap_bilgisi",
    "",
    "",
    800,
    "USD",
    31.8,
    "",
  ],
];

// ─── Şablon İndir ─────────────────────────────────────────────────────────────

function sablonIndir() {
  const wb = XLSX.utils.book_new();

  // ── Veri sayfası
  const veriSayfasi = XLSX.utils.aoa_to_sheet([[...SUTUNLAR], ...ORNEK_SATIRLAR]);

  // Sütun genişlikleri
  veriSayfasi["!cols"] = [
    { wch: 18 }, { wch: 20 }, { wch: 24 }, { wch: 32 },
    { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 8 }, { wch: 28 },
  ];

  // Başlık satırı stili (xlsx community edition sadece cell referansına erişebilir)
  // Stil için xlsx-style gerekir; burada sadece font-bold yorum olarak bırakıyoruz
  XLSX.utils.book_append_sheet(wb, veriSayfasi, "Belgeler");

  // ── Kılavuz sayfası
  const kilavuz = XLSX.utils.aoa_to_sheet([
    ["ALAN", "AÇIKLAMA", "ZORUNLU", "KABUL EDİLEN DEĞERLER"],
    ["Belge No", "Fatura veya belge numarası", "EVET", "Herhangi bir metin"],
    ["Tarih", "Belge tarihi", "EVET", "YYYY-AA-GG formatında (örn: 2024-01-15)"],
    ["Vade Tarihi", "Ödeme vadesi", "Hayır", "YYYY-AA-GG formatında"],
    ["Tür", "Belge türü", "EVET", "fatura | proforma | hesap_bilgisi"],
    ["Firma Adı", "Sistemdeki firma adı (tam eşleşme)", "Hayır", "Sistemde kayıtlı firma adı"],
    ["Gemi Adı", "Gemi/vessel adı", "Hayır", "Herhangi bir metin (örn: M/V ATLANTIC STAR)"],
    ["Tutar", "Belge tutarı (sayısal)", "EVET", "Pozitif sayı (örn: 1500.50)"],
    ["Para Birimi", "Ödeme para birimi", "EVET", "TRY | EUR | USD"],
    ["Kur", "1 birim dövizin TL karşılığı (TRY için 1)", "EVET", "Pozitif sayı"],
    ["Açıklama", "Serbest açıklama", "Hayır", "Herhangi bir metin"],
    [],
    ["NOT: Firma Adı sistemde tam olarak eşleşmezse belge firmaya bağlanmaz."],
    ["NOT: Tarih alanı YYYY-AA-GG formatında olmalıdır (örn: 2024-01-15)."],
    ["NOT: TRY belgeler için Kur değeri 1 giriniz."],
  ]);
  kilavuz["!cols"] = [{ wch: 16 }, { wch: 42 }, { wch: 12 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, kilavuz, "Kılavuz");

  XLSX.writeFile(wb, "cari_belge_import_sablonu.xlsx");
}

// ─── Excel Parse ──────────────────────────────────────────────────────────────

function excelTarihCevir(val: unknown): string {
  if (typeof val === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  if (typeof val === "string") {
    // Türkçe format: GG.AA.YYYY → YYYY-AA-GG
    const trMatch = val.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (trMatch) return `${trMatch[3]}-${trMatch[2].padStart(2, "0")}-${trMatch[1].padStart(2, "0")}`;
    // ISO zaten
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  }
  return String(val ?? "");
}

function excelDosyaParse(buf: ArrayBuffer): ImportSatir[] {
  const wb = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: true,
  });

  return rows.map((r) => {
    const al = (keys: string[]): unknown => {
      for (const k of keys) {
        const val = r[k] ?? r[k.toLowerCase()] ?? r[k.toUpperCase()];
        if (val !== undefined && val !== "") return val;
      }
      return "";
    };

    const tutarRaw = al(["Tutar", "tutar", "TUTAR"]);
    const kurRaw = al(["Kur", "kur", "KUR"]);

    return {
      belge_no: String(al(["Belge No", "belge_no", "BELGE NO"]) ?? ""),
      tarih: excelTarihCevir(al(["Tarih (YYYY-AA-GG)", "Tarih", "tarih", "TARIH"])),
      vade_tarihi: excelTarihCevir(al(["Vade Tarihi (YYYY-AA-GG)", "Vade Tarihi", "vade_tarihi"])) || undefined,
      tur: String(al(["Tür (fatura/proforma/hesap_bilgisi)", "Tür", "tur", "TÜR", "Tur"]) ?? "").toLowerCase(),
      firma_adi: String(al(["Firma Adı", "firma_adi", "Firma", "FIRMA"]) ?? "") || undefined,
      gemi_adi: String(al(["Gemi Adı", "gemi_adi", "Gemi", "GEMI"]) ?? "") || undefined,
      tutar: typeof tutarRaw === "number" ? tutarRaw : parseFloat(String(tutarRaw).replace(",", ".")) || 0,
      para_birimi: String(al(["Para Birimi (TRY/EUR/USD)", "Para Birimi", "para_birimi", "PB"]) ?? "TRY").toUpperCase(),
      kur: typeof kurRaw === "number" ? kurRaw : parseFloat(String(kurRaw).replace(",", ".")) || 1,
      aciklama: String(al(["Açıklama", "aciklama", "ACIKLAMA"]) ?? "") || undefined,
    } satisfies ImportSatir;
  });
}

// ─── Önizleme Tablosu ─────────────────────────────────────────────────────────

function OnizlemeTablo({ satirlar }: { satirlar: ImportSatir[] }) {
  return (
    <div className="overflow-auto rounded-xl border max-h-72">
      <table className="text-xs w-full min-w-max border-collapse">
        <thead>
          <tr className="bg-muted/60 sticky top-0">
            {["#", "Belge No", "Tarih", "Vade", "Tür", "Firma", "Gemi", "Tutar", "PB", "Kur", "Açıklama"].map((h) => (
              <th key={h} className="px-2 py-2 text-left font-semibold border-b border-border whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {satirlar.map((s, i) => (
            <tr key={i} className="hover:bg-muted/30 transition-colors">
              <td className="px-2 py-1.5 border-b border-border/40 text-muted-foreground">{i + 2}</td>
              <td className="px-2 py-1.5 border-b border-border/40 font-medium">{s.belge_no}</td>
              <td className="px-2 py-1.5 border-b border-border/40">{s.tarih}</td>
              <td className="px-2 py-1.5 border-b border-border/40 text-muted-foreground">{s.vade_tarihi ?? "—"}</td>
              <td className="px-2 py-1.5 border-b border-border/40">
                <Badge variant="outline" className="text-[10px]">{s.tur}</Badge>
              </td>
              <td className="px-2 py-1.5 border-b border-border/40">{s.firma_adi ?? "—"}</td>
              <td className="px-2 py-1.5 border-b border-border/40">{s.gemi_adi ?? "—"}</td>
              <td className="px-2 py-1.5 border-b border-border/40 tabular-nums text-right font-semibold">
                {s.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-1.5 border-b border-border/40">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    s.para_birimi === "TRY"
                      ? "text-blue-600 border-blue-200"
                      : s.para_birimi === "EUR"
                      ? "text-emerald-600 border-emerald-200"
                      : "text-amber-600 border-amber-200"
                  }`}
                >
                  {s.para_birimi}
                </Badge>
              </td>
              <td className="px-2 py-1.5 border-b border-border/40 tabular-nums">{s.kur}</td>
              <td className="px-2 py-1.5 border-b border-border/40 text-muted-foreground max-w-[140px] truncate">
                {s.aciklama ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Import Sonuç Ekranı ──────────────────────────────────────────────────────

function ImportSonucEkrani({
  sonuc,
  onKapat,
}: {
  sonuc: ImportSonuc;
  onKapat: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Özet */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {sonuc.basarili}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Başarıyla içe aktarıldı</p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${
          sonuc.hatali > 0
            ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
            : "bg-muted border-border"
        }`}>
          <XCircle className={`h-6 w-6 mx-auto mb-1 ${sonuc.hatali > 0 ? "text-rose-600" : "text-muted-foreground"}`} />
          <p className={`text-2xl font-bold tabular-nums ${sonuc.hatali > 0 ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground"}`}>
            {sonuc.hatali}
          </p>
          <p className={`text-xs font-medium ${sonuc.hatali > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
            Hatalı satır
          </p>
        </div>
      </div>

      {/* Hata listesi */}
      {sonuc.hatalar.length > 0 && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 overflow-hidden">
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-800">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Hata Detayları
            </p>
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-border">
            {sonuc.hatalar.map((h, i) => (
              <div key={i} className="px-4 py-2 flex items-start gap-3">
                <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                  Satır {h.satir}
                </span>
                <span className="text-xs text-foreground">{h.mesaj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={onKapat} className="w-full">
        Kapat
      </Button>
    </div>
  );
}

// ─── Ana Modal ────────────────────────────────────────────────────────────────

interface BelgeImportModalProps {
  acik: boolean;
  onKapat: () => void;
}

type Adim = "yukle" | "onizle" | "sonuc";

export function BelgeImportModal({ acik, onKapat }: BelgeImportModalProps) {
  const { invalidateBelgeList, invalidateKpi } = useInvalidateCari();

  async function invalidate() {
    await invalidateBelgeList();
    await invalidateKpi();
  }

  const [adim, setAdim] = React.useState<Adim>("yukle");
  const [satirlar, setSatirlar] = React.useState<ImportSatir[]>([]);
  const [sonuc, setSonuc] = React.useState<ImportSonuc | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [surukleniyor, setSurukleniyor] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleKapat() {
    setAdim("yukle");
    setSatirlar([]);
    setSonuc(null);
    // Aynı dosyanın tekrar seçilebilmesi için input'u sıfırla
    if (inputRef.current) inputRef.current.value = "";
    onKapat();
  }

  async function handleDosya(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Sadece Excel (.xlsx, .xls) veya CSV dosyası yükleyin.");
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const parsed = excelDosyaParse(buf);
      if (parsed.length === 0) {
        toast.error("Dosyada veri satırı bulunamadı.");
        return;
      }
      setSatirlar(parsed);
      setAdim("onizle");
    } catch {
      toast.error("Dosya okunamadı. Lütfen şablonu kullanın.");
    }
  }

  async function handleImport() {
    if (satirlar.length === 0) return;
    setImporting(true);
    try {
      const res = await belgeBulkImport(satirlar);
      if (!res.basarili) {
        toast.error(`İçe aktarma hatası: ${res.hata}`);
        return;
      }
      setSonuc(res.veri!);
      setAdim("sonuc");
      await invalidate();
      if (res.veri!.basarili > 0) {
        toast.success(`${res.veri!.basarili} belge başarıyla içe aktarıldı.`);
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={acik} onOpenChange={(o) => !o && handleKapat()}>
      <DialogContent className="sm:max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Excel&apos;den Toplu İçe Aktar
          </DialogTitle>
        </DialogHeader>

        {/* Adım göstergesi */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(["yukle", "onizle", "sonuc"] as Adim[]).map((a, i) => {
            const label = { yukle: "Dosya Yükle", onizle: "Önizle", sonuc: "Sonuç" }[a];
            const aktif = adim === a;
            const gecildi = ["yukle", "onizle", "sonuc"].indexOf(adim) > i;
            return (
              <React.Fragment key={a}>
                <span className={`font-semibold ${aktif ? "text-primary" : gecildi ? "text-emerald-600" : ""}`}>
                  {label}
                </span>
                {i < 2 && <ChevronRight className="h-3 w-3 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* ADIM 1: Dosya Yükle */}
        {adim === "yukle" && (
          <div className="space-y-4">
            {/* Şablon indir */}
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">İçe Aktarma Şablonu</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verileri bu şablona göre doldurun
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={sablonIndir}
              >
                <Download className="h-3.5 w-3.5" />
                Şablon İndir
              </Button>
            </div>

            {/* Upload alanı */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                surukleniyor
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
              }`}
              onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
              onDragLeave={() => setSurukleniyor(false)}
              onDrop={(e) => { e.preventDefault(); setSurukleniyor(false); handleDosya(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleDosya(e.target.files)}
              />
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-muted-foreground">
                Excel veya CSV dosyasını buraya sürükleyin
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">.xlsx · .xls · .csv</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                <Upload className="h-3.5 w-3.5" />
                Dosya Seç
              </Button>
            </div>
          </div>
        )}

        {/* ADIM 2: Önizle */}
        {adim === "onizle" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{satirlar.length}</span> satır okundu
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                onClick={() => { setSatirlar([]); setAdim("yukle"); }}
              >
                <X className="h-3 w-3" />
                Değiştir
              </Button>
            </div>

            <OnizlemeTablo satirlar={satirlar} />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setSatirlar([]); setAdim("yukle"); }}
              >
                Geri
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {importing ? "İçe Aktarılıyor…" : `${satirlar.length} Belgeyi Aktar`}
              </Button>
            </div>
          </div>
        )}

        {/* ADIM 3: Sonuç */}
        {adim === "sonuc" && sonuc && (
          <ImportSonucEkrani sonuc={sonuc} onKapat={handleKapat} />
        )}
      </DialogContent>
    </Dialog>
  );
}
