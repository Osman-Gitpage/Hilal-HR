"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  policeEkleAction,
  muayeneGuncelleAction,
  garajDosyaYukleAction,
} from "@/app/actions/garaj";
import { toast } from "sonner";
import {
  ShieldCheck,
  Calendar,
  Umbrella,
  Check,
  ChevronRight,
  ArrowRight,
  UploadCloud,
  FileCheck,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AracOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aracId: string;
  aracBilgi?: {
    plaka: string;
    marka: string;
    model: string;
  };
  onTamamlandi?: () => void;
}

const SIGORTA_SIRKETLERI = [
  "Hepiyi Sigorta",
  "Allianz Sigorta",
  "Anadolu Sigorta",
  "Axa Sigorta",
  "Türkiye Sigorta",
  "Sompo Sigorta",
  "Aksigorta",
  "Mapfre Sigorta",
  "Quick Sigorta",
  "HDI Sigorta",
  "Doğa Sigorta",
  "Neova Sigorta",
  "Güneş Sigorta",
];

export function AracOnboardingModal({
  open,
  onOpenChange,
  aracId,
  aracBilgi,
  onTamamlandi,
}: AracOnboardingModalProps) {
  const router = useRouter();
  const [aktifAdim, setAktifAdim] = useState<1 | 2 | 3>(1);
  const [yukleniyor, setYukleniyor] = useState(false);

  // ── Adım 1: Zorunlu Trafik Sigortası State ──
  const [trafikSirket, setTrafikSirket] = useState("Allianz Sigorta");
  const [trafikPoliceNo, setTrafikPoliceNo] = useState("");
  const [trafikBitisTarihi, setTrafikBitisTarihi] = useState("");
  const [trafikTutar, setTrafikTutar] = useState<number | "">("");
  const [trafikDosya, setTrafikDosya] = useState<File | null>(null);
  const [trafikDosyaAdi, setTrafikDosyaAdi] = useState("");
  const trafikFileRef = useRef<HTMLInputElement>(null);

  // ── Adım 2: TÜVTÜRK Muayenesi State ──
  const [muayeneTarihi, setMuayeneTarihi] = useState("");
  const [istasyon, setIstasyon] = useState("");
  const [muayeneUcreti, setMuayeneUcreti] = useState<number | "">("");
  const [raporNo, setRaporNo] = useState("");
  const [sonuc, setSonuc] = useState("Kusursuz Geçti");
  const [egzozEmisyonTarihi, setEgzozEmisyonTarihi] = useState("");
  const [muayeneDosya, setMuayeneDosya] = useState<File | null>(null);
  const [muayeneDosyaAdi, setMuayeneDosyaAdi] = useState("");
  const muayeneFileRef = useRef<HTMLInputElement>(null);

  // ── Adım 3: Kasko Poliçesi State ──
  const [kaskoSirket, setKaskoSirket] = useState("Anadolu Sigorta");
  const [kaskoPoliceNo, setKaskoPoliceNo] = useState("");
  const [kaskoBitisTarihi, setKaskoBitisTarihi] = useState("");
  const [kaskoTutar, setKaskoTutar] = useState<number | "">("");
  const [kaskoDosya, setKaskoDosya] = useState<File | null>(null);
  const [kaskoDosyaAdi, setKaskoDosyaAdi] = useState("");
  const kaskoFileRef = useRef<HTMLInputElement>(null);

  // ── Tamamlanan Adımlar ──
  const [tamamlananAdimlar, setTamamlananAdimlar] = useState<number[]>([]);

  // ── 1. Trafik Sigortası Kaydet ──
  const handleTrafikKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trafikPoliceNo.trim() || !trafikBitisTarihi.trim()) {
      toast.error("Lütfen Trafik Sigortası poliçe no ve bitiş tarihini giriniz.");
      return;
    }

    setYukleniyor(true);
    let uploadedUrl: string | undefined;
    let finalDocName = trafikDosyaAdi;

    if (trafikDosya) {
      const formData = new FormData();
      formData.append("file", trafikDosya);
      const uploadRes = await garajDosyaYukleAction(formData);
      if (uploadRes.basarili && uploadRes.veri) {
        uploadedUrl = uploadRes.veri.url;
        finalDocName = uploadRes.veri.dosyaAdi;
      }
    }

    const res = await policeEkleAction(aracId, {
      tur: "Trafik Sigortası",
      sirket: trafikSirket.trim(),
      policeNo: trafikPoliceNo.trim().toUpperCase(),
      bitisTarihi: trafikBitisTarihi,
      tutar: typeof trafikTutar === "number" ? trafikTutar : undefined,
      belgeAdi: finalDocName || undefined,
      belgeUrl: uploadedUrl,
    });

    setYukleniyor(false);

    if (res.basarili) {
      toast.success("Zorunlu Trafik Sigortası başarıyla kaydedildi.");
      setTamamlananAdimlar((prev) => [...prev, 1]);
      setAktifAdim(2);
    } else {
      toast.error(res.hata || "Trafik sigortası eklenemedi.");
    }
  };

  // ── 2. Muayene Bilgisi Kaydet ──
  const handleMuayeneKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!muayeneTarihi.trim()) {
      toast.error("Lütfen muayene geçerlilik tarihini giriniz.");
      return;
    }

    setYukleniyor(true);
    let uploadedUrl: string | undefined;
    let finalDocName = muayeneDosyaAdi;

    if (muayeneDosya) {
      const formData = new FormData();
      formData.append("file", muayeneDosya);
      const uploadRes = await garajDosyaYukleAction(formData);
      if (uploadRes.basarili && uploadRes.veri) {
        uploadedUrl = uploadRes.veri.url;
        finalDocName = uploadRes.veri.dosyaAdi;
      }
    }

    const res = await muayeneGuncelleAction(aracId, {
      muayeneTarihi,
      kalanGun: 0,
      muayeneUcreti: typeof muayeneUcreti === "number" ? muayeneUcreti : undefined,
      istasyon: istasyon.trim() || undefined,
      raporNo: raporNo.trim() || undefined,
      sonuc,
      egzozEmisyonTarihi: egzozEmisyonTarihi.trim() || undefined,
      belgeAdi: finalDocName || undefined,
      belgeUrl: uploadedUrl,
    });

    setYukleniyor(false);

    if (res.basarili) {
      toast.success("TÜVTÜRK muayene bilgisi kaydedildi.");
      setTamamlananAdimlar((prev) => [...prev, 2]);
      setAktifAdim(3);
    } else {
      toast.error(res.hata || "Muayene bilgisi eklenemedi.");
    }
  };

  // ── 3. Kasko Kaydet ──
  const handleKaskoKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kaskoPoliceNo.trim() || !kaskoBitisTarihi.trim()) {
      toast.error("Lütfen Kasko poliçe no ve bitiş tarihini giriniz.");
      return;
    }

    setYukleniyor(true);
    let uploadedUrl: string | undefined;
    let finalDocName = kaskoDosyaAdi;

    if (kaskoDosya) {
      const formData = new FormData();
      formData.append("file", kaskoDosya);
      const uploadRes = await garajDosyaYukleAction(formData);
      if (uploadRes.basarili && uploadRes.veri) {
        uploadedUrl = uploadRes.veri.url;
        finalDocName = uploadRes.veri.dosyaAdi;
      }
    }

    const res = await policeEkleAction(aracId, {
      tur: "Kasko",
      sirket: kaskoSirket.trim(),
      policeNo: kaskoPoliceNo.trim().toUpperCase(),
      bitisTarihi: kaskoBitisTarihi,
      tutar: typeof kaskoTutar === "number" ? kaskoTutar : undefined,
      belgeAdi: finalDocName || undefined,
      belgeUrl: uploadedUrl,
    });

    setYukleniyor(false);

    if (res.basarili) {
      toast.success("Kasko poliçesi başarıyla kaydedildi.");
      setTamamlananAdimlar((prev) => [...prev, 3]);
      bitir();
    } else {
      toast.error(res.hata || "Kasko eklenemedi.");
    }
  };

  const bitir = () => {
    onOpenChange(false);
    if (onTamamlandi) onTamamlandi();
    router.push(`/garaj/${aracId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-0 shadow-2xl overflow-hidden">
        {/* ── Üst Başlık ── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Araç Başarıyla Eklendi!</span>
                  {aracBilgi && (
                    <span className="px-2 py-0.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-bold">
                      {aracBilgi.plaka}
                    </span>
                  )}
                </DialogTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {aracBilgi ? `${aracBilgi.marka} ${aracBilgi.model}` : "Filo Aracı"} için zorunlu yasal kayıtları tanımlayın
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={bitir}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Şimdilik Kapat
            </button>
          </div>

          {/* ── Adım Çubuğu (Stepper) ── */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            {/* Adım 1 */}
            <button
              type="button"
              onClick={() => setAktifAdim(1)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                aktifAdim === 1
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : tamamlananAdimlar.includes(1)
                  ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-zinc-200 dark:border-zinc-800 opacity-60"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  tamamlananAdimlar.includes(1)
                    ? "bg-emerald-600 text-white"
                    : aktifAdim === 1
                    ? "bg-primary text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                {tamamlananAdimlar.includes(1) ? <Check className="w-3.5 h-3.5" /> : "1"}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  Trafik Sigortası
                </p>
                <p className="text-[9px] text-zinc-400 truncate">Zorunlu Poliçe</p>
              </div>
            </button>

            {/* Adım 2 */}
            <button
              type="button"
              onClick={() => setAktifAdim(2)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                aktifAdim === 2
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : tamamlananAdimlar.includes(2)
                  ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-zinc-200 dark:border-zinc-800 opacity-60"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  tamamlananAdimlar.includes(2)
                    ? "bg-emerald-600 text-white"
                    : aktifAdim === 2
                    ? "bg-primary text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                {tamamlananAdimlar.includes(2) ? <Check className="w-3.5 h-3.5" /> : "2"}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  TÜVTÜRK Muayene
                </p>
                <p className="text-[9px] text-zinc-400 truncate">Geçerlilik Tarihi</p>
              </div>
            </button>

            {/* Adım 3 */}
            <button
              type="button"
              onClick={() => setAktifAdim(3)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                aktifAdim === 3
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : tamamlananAdimlar.includes(3)
                  ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-zinc-200 dark:border-zinc-800 opacity-60"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  tamamlananAdimlar.includes(3)
                    ? "bg-emerald-600 text-white"
                    : aktifAdim === 3
                    ? "bg-primary text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                {tamamlananAdimlar.includes(3) ? <Check className="w-3.5 h-3.5" /> : "3"}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  Kasko Sigortası
                </p>
                <p className="text-[9px] text-zinc-400 truncate">Opsiyonel</p>
              </div>
            </button>
          </div>
        </DialogHeader>

        {/* ── Adım Gövdesi ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ════════ ADIM 1: TRAFİK SİGORTASI ════════ */}
          {aktifAdim === 1 && (
            <form onSubmit={handleTrafikKaydet} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-blue-950 dark:text-blue-200 text-xs">
                    Zorunlu Karayolları Motorlu Araçlar Trafik Sigortası
                  </p>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                    Trafiğe çıkacak tüm şirket araçlarının geçerli bir Zorunlu Trafik Sigortası bulunmalıdır.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Sigorta Şirketi *</Label>
                <Select value={trafikSirket} onValueChange={(val) => { if (val) setTrafikSirket(val); }}>
                  <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Şirket Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGORTA_SIRKETLERI.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Poliçe Numarası *</Label>
                  <Input
                    placeholder="Örn: TRF-2026-8819"
                    value={trafikPoliceNo}
                    onChange={(e) => setTrafikPoliceNo(e.target.value)}
                    required
                    className="rounded-xl h-9 text-xs font-mono uppercase font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Poliçe Bitiş Tarihi *</Label>
                  <Input
                    type="date"
                    value={trafikBitisTarihi}
                    onChange={(e) => setTrafikBitisTarihi(e.target.value)}
                    required
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Ödenen Prim Tutarı (₺)</Label>
                  <Input
                    type="number"
                    placeholder="Örn: 12500"
                    value={trafikTutar}
                    onChange={(e) => setTrafikTutar(e.target.value ? Number(e.target.value) : "")}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>

                {/* Poliçe Dosyası */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Poliçe Belgesi (PDF / Görsel)</Label>
                  <input
                    type="file"
                    ref={trafikFileRef}
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setTrafikDosya(file);
                        setTrafikDosyaAdi(file.name);
                      }
                    }}
                    className="hidden"
                  />
                  {!trafikDosyaAdi ? (
                    <button
                      type="button"
                      onClick={() => trafikFileRef.current?.click()}
                      className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 text-xs font-medium cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Dosya Seç
                    </button>
                  ) : (
                    <div className="flex items-center justify-between h-9 px-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs">
                      <span className="truncate max-w-[180px] font-medium">{trafikDosyaAdi}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTrafikDosya(null);
                          setTrafikDosyaAdi("");
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAktifAdim(2)}
                  className="rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Bu Adımı Şimdilik Atla
                </Button>

                <Button
                  type="submit"
                  disabled={yukleniyor}
                  className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold"
                >
                  {yukleniyor && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Kaydet ve Muayene Adımına Geç
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          )}

          {/* ════════ ADIM 2: TÜVTÜRK MUAYENESİ ════════ */}
          {aktifAdim === 2 && (
            <form onSubmit={handleMuayeneKaydet} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-indigo-950 dark:text-indigo-200 text-xs">
                    TÜVTÜRK Periyodik Araç Muayenesi & Egzoz Emisyonu
                  </p>
                  <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                    Aracın bir sonraki muayene geçerlilik tarihini girerek gecikme cezalarının önüne geçin.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Muayene Son Geçerlilik Tarihi *</Label>
                  <Input
                    type="date"
                    value={muayeneTarihi}
                    onChange={(e) => setMuayeneTarihi(e.target.value)}
                    required
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Egzoz Emisyon Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={egzozEmisyonTarihi}
                    onChange={(e) => setEgzozEmisyonTarihi(e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Muayene İstasyonu</Label>
                  <Input
                    placeholder="Örn: Maslak İstasyonu"
                    value={istasyon}
                    onChange={(e) => setIstasyon(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Muayene Ücreti (₺)</Label>
                  <Input
                    type="number"
                    placeholder="Örn: 2620"
                    value={muayeneUcreti}
                    onChange={(e) => setMuayeneUcreti(e.target.value ? Number(e.target.value) : "")}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Muayene Sonucu</Label>
                  <Select value={sonuc} onValueChange={(val) => { if (val) setSonuc(val); }}>
                    <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kusursuz Geçti">Kusursuz Geçti</SelectItem>
                      <SelectItem value="Hafif Kusurlu Geçti">Hafif Kusurlu Geçti</SelectItem>
                      <SelectItem value="Muayene Tekrarı">Muayene Tekrarı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rapor Dosyası */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Muayene Raporu / Belgesi (PDF / Görsel)</Label>
                <input
                  type="file"
                  ref={muayeneFileRef}
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMuayeneDosya(file);
                      setMuayeneDosyaAdi(file.name);
                    }
                  }}
                  className="hidden"
                />
                {!muayeneDosyaAdi ? (
                  <button
                    type="button"
                    onClick={() => muayeneFileRef.current?.click()}
                    className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 text-xs font-medium cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Muayene Raporu Yükle
                  </button>
                ) : (
                  <div className="flex items-center justify-between h-9 px-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs">
                    <span className="truncate max-w-[280px] font-medium">{muayeneDosyaAdi}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMuayeneDosya(null);
                        setMuayeneDosyaAdi("");
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Butonlar */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAktifAdim(3)}
                  className="rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Bu Adımı Şimdilik Atla
                </Button>

                <Button
                  type="submit"
                  disabled={yukleniyor}
                  className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold"
                >
                  {yukleniyor && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Kaydet ve Kasko Adımına Geç
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          )}

          {/* ════════ ADIM 3: KASKO SİGORTASI (OPSİYONEL) ════════ */}
          {aktifAdim === 3 && (
            <form onSubmit={handleKaskoKaydet} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 flex items-start gap-3">
                <Umbrella className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950 dark:text-amber-200 text-xs">
                    Kasko Poliçesi (Opsiyonel Güvence)
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    Aracınızın kasko teminatı varsa ekleyebilir veya kaskosu yoksa bu adımı atlayıp kurulumu tamamlayabilirsiniz.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Sigorta Şirketi</Label>
                <Select value={kaskoSirket} onValueChange={(val) => { if (val) setKaskoSirket(val); }}>
                  <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Şirket Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGORTA_SIRKETLERI.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Kasko Poliçe No *</Label>
                  <Input
                    placeholder="Örn: KSK-2026-4412"
                    value={kaskoPoliceNo}
                    onChange={(e) => setKaskoPoliceNo(e.target.value)}
                    required
                    className="rounded-xl h-9 text-xs font-mono uppercase font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Poliçe Bitiş Tarihi *</Label>
                  <Input
                    type="date"
                    value={kaskoBitisTarihi}
                    onChange={(e) => setKaskoBitisTarihi(e.target.value)}
                    required
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Ödenen Prim Tutarı (₺)</Label>
                  <Input
                    type="number"
                    placeholder="Örn: 24500"
                    value={kaskoTutar}
                    onChange={(e) => setKaskoTutar(e.target.value ? Number(e.target.value) : "")}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>

                {/* Kasko Dosyası */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Kasko Poliçesi Belgesi</Label>
                  <input
                    type="file"
                    ref={kaskoFileRef}
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setKaskoDosya(file);
                        setKaskoDosyaAdi(file.name);
                      }
                    }}
                    className="hidden"
                  />
                  {!kaskoDosyaAdi ? (
                    <button
                      type="button"
                      onClick={() => kaskoFileRef.current?.click()}
                      className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 text-xs font-medium cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Dosya Seç
                    </button>
                  ) : (
                    <div className="flex items-center justify-between h-9 px-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs">
                      <span className="truncate max-w-[180px] font-medium">{kaskoDosyaAdi}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setKaskoDosya(null);
                          setKaskoDosyaAdi("");
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={bitir}
                  className="rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Kaskom Yok / Kurulumu Tamamla
                </Button>

                <Button
                  type="submit"
                  disabled={yukleniyor}
                  className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {yukleniyor && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Kaydet ve Kurulumu Bitir
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
