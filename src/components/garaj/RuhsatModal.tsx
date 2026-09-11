"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Arac } from "./types";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Download,
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { garajDosyaYukleAction, ruhsatBelgesiGuncelleAction } from "@/app/actions/garaj";
import { toast } from "sonner";

interface RuhsatModalProps {
  arac: Arac;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBelgeGuncellendi?: (belgeUrl: string | null, belgeAdi: string | null) => void;
}

export function RuhsatModal({
  arac,
  open,
  onOpenChange,
  onBelgeGuncellendi,
}: RuhsatModalProps) {
  const router = useRouter();

  // Aktif belge state'leri
  const [belgeUrl, setBelgeUrl] = useState<string | null>(
    arac.ruhsat?.belgeUrl || null
  );
  const [belgeAdi, setBelgeAdi] = useState<string | null>(
    arac.ruhsat?.belgeAdi || null
  );

  // Görüntüleyici & Yükleyici modları
  const [yuklemeModu, setYuklemeModu] = useState(false);
  const [secilenDosya, setSecilenDosya] = useState<File | null>(null);
  const [dosyaOnizleme, setDosyaOnizleme] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);
  const [scale, setScale] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal açıldığında veya araç değiştiğinde senkronize et
  useEffect(() => {
    const mevcutUrl = arac.ruhsat?.belgeUrl || null;
    const mevcutAdi = arac.ruhsat?.belgeAdi || null;
    setBelgeUrl(mevcutUrl);
    setBelgeAdi(mevcutAdi);
    // Belge yoksa direkt yükleme modunu aç
    setYuklemeModu(!mevcutUrl);
    setSecilenDosya(null);
    setDosyaOnizleme(null);
    setScale(1);
  }, [arac.ruhsat?.belgeUrl, arac.ruhsat?.belgeAdi, open]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setScale(1);

  // Dosya Seçme
  const handleDosyaSec = (file: File) => {
    if (!file) return;

    const gecerliTipler = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "application/pdf"];
    if (!gecerliTipler.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|svg|pdf)$/i)) {
      toast.error("Lütfen geçerli bir görsel (JPG, PNG, WEBP) veya PDF dosyası seçiniz.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Dosya boyutu maksimum 15MB olabilir.");
      return;
    }

    setSecilenDosya(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setDosyaOnizleme(url);
    } else {
      setDosyaOnizleme(null);
    }
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDosyaSec(e.dataTransfer.files[0]);
    }
  };

  // Dosya Yükleme İşlemi
  const handleYukle = async () => {
    if (!secilenDosya) {
      toast.error("Lütfen yüklenecek bir ruhsat belgesi seçin.");
      return;
    }

    setYukleniyor(true);
    try {
      const formData = new FormData();
      formData.append("file", secilenDosya);

      const resYukle = await garajDosyaYukleAction(formData);
      if (!resYukle.basarili) {
        throw new Error(resYukle.hata || "Dosya yüklenemedi.");
      }

      const yeniUrl = resYukle.veri.url;
      const yeniDosyaAdi = resYukle.veri.dosyaAdi;

      // Veritabanına ruhsat_belge_url & ruhsat_belge_adi kaydet
      const resGuncelle = await ruhsatBelgesiGuncelleAction(
        arac.id,
        yeniUrl,
        yeniDosyaAdi
      );

      if (!resGuncelle.basarili) {
        throw new Error(resGuncelle.hata || "Ruhsat belgesi araca kaydedilemedi.");
      }

      setBelgeUrl(yeniUrl);
      setBelgeAdi(yeniDosyaAdi);
      setYuklemeModu(false);
      setSecilenDosya(null);
      setDosyaOnizleme(null);

      if (onBelgeGuncellendi) {
        onBelgeGuncellendi(yeniUrl, yeniDosyaAdi);
      }

      toast.success("Ruhsat belgesi başarıyla yüklendi.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Ruhsat yüklenirken bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  // Ruhsat Belgesini Kaldırma / Silme
  const handleBelgeSil = async () => {
    if (!confirm("Ruhsat belgesini kaldırmak istediğinize emin misiniz?")) return;

    setSiliniyor(true);
    try {
      const res = await ruhsatBelgesiGuncelleAction(arac.id, null, null);
      if (!res.basarili) {
        throw new Error(res.hata || "Belge silinemedi.");
      }

      setBelgeUrl(null);
      setBelgeAdi(null);
      setYuklemeModu(true);
      setSecilenDosya(null);
      setDosyaOnizleme(null);

      if (onBelgeGuncellendi) {
        onBelgeGuncellendi(null, null);
      }

      toast.success("Ruhsat belgesi kaldırıldı.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Belge kaldırılırken hata oluştu.");
    } finally {
      setSiliniyor(false);
    }
  };

  const isPdf = belgeUrl?.toLowerCase().endsWith(".pdf") || belgeAdi?.toLowerCase().endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[94vh] flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-0 shadow-2xl overflow-hidden">
        {/* ── Modal Başlığı ve Kontroller ── */}
        <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shrink-0 pr-12">
          <div className="space-y-0.5">
            <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
              <span>Araç Ruhsat Belgesi</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                {arac.plaka}
              </span>
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {arac.marka} {arac.model} • {belgeAdi || "Resmi Tescil Belgesi / Ruhsat Taraması"}
            </p>
          </div>

          {/* Sağ Aksiyon Butonları */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Belge Varsa ve Görüntüleme Modundaysak Kontrolleri Göster */}
            {belgeUrl && !yuklemeModu && (
              <>
                {/* Yakınlaştırma Araçları (Sadece Görseller İçin) */}
                {!isPdf && (
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/90 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      className="h-7 w-7 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                      title="Küçült"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-[11px] font-mono px-1.5 text-zinc-600 dark:text-zinc-400 min-w-[40px] text-center font-semibold">
                      %{Math.round(scale * 100)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      className="h-7 w-7 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                      title="Büyüt"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleResetZoom}
                      className="h-7 w-7 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                      title="Sıfırla"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Yazdır */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isPdf) {
                      window.open(belgeUrl, "_blank");
                    } else {
                      window.print();
                    }
                  }}
                  className="h-8 text-xs gap-1.5 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Yazdır</span>
                </Button>

                {/* İndir */}
                <a
                  href={belgeUrl}
                  download={belgeAdi || `${arac.plaka}-ruhsat`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">İndir</span>
                </a>

                {/* Yenisini Yükle / Değiştir */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setYuklemeModu(true)}
                  className="h-8 text-xs gap-1.5 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Değiştir</span>
                </Button>

                {/* Belgeyi Sil */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={siliniyor}
                  onClick={handleBelgeSil}
                  className="h-8 text-xs gap-1.5 rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                  title="Ruhsat Belgesini Kaldır"
                >
                  {siliniyor ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden md:inline">Kaldır</span>
                </Button>
              </>
            )}

            {/* Yükleme Modundayken Belge Varsa İptal Butonu */}
            {yuklemeModu && belgeUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setYuklemeModu(false);
                  setSecilenDosya(null);
                  setDosyaOnizleme(null);
                }}
                className="h-8 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
              >
                Görüntülemeye Dön
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* ── MODAL GÖVDESİ: GÖRÜNTÜLEME VEYA YÜKLEME ── */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-zinc-50/80 dark:bg-zinc-950/90 flex items-center justify-center min-h-[380px] sm:min-h-[500px]">
          {yuklemeModu ? (
            /* ══════ YÜKLEME EKRANI ══════ */
            <div className="w-full max-w-xl mx-auto space-y-5">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleDosyaSec(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/20">
                    <FileUp className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Ruhsat Belgesini Buraya Sürükleyin veya Seçin
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      JPG, PNG, WEBP veya PDF formatında yükleyebilirsiniz (Maks. 15MB)
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs text-zinc-700 dark:text-zinc-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Dosya Seç
                  </Button>
                </div>
              </div>

              {/* Seçilen Dosya Önizlemesi */}
              {secilenDosya && (
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/40">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {secilenDosya.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {(secilenDosya.size / (1024 * 1024)).toFixed(2)} MB • {secilenDosya.type || "Belge"}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSecilenDosya(null);
                        setDosyaOnizleme(null);
                      }}
                      className="text-zinc-500 hover:text-red-500 h-8 text-xs"
                    >
                      Kaldır
                    </Button>
                  </div>

                  {/* Görsel Küçük Önizleme */}
                  {dosyaOnizleme && (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
                      <Image
                        src={dosyaOnizleme}
                        alt="Önizleme"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={handleYukle}
                      disabled={yukleniyor}
                      className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-2 shadow-md shadow-emerald-600/20"
                    >
                      {yukleniyor ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Ruhsat Belgesi Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Ruhsatı Kaydet ve Görüntüle
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Bilgi Kutusu */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-400 shadow-sm">
                <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Yüklenen ruhsat belgesi güvenli bulut depolama alanında arşivlenir ve araç detay sayfasında dilediğiniz zaman görüntülenebilir veya yazdırılabilir.
                </span>
              </div>
            </div>
          ) : (
            /* ══════ GÖRÜNTÜLEME EKRANI ══════ */
            <div className="w-full h-full flex items-center justify-center overflow-auto py-2">
              {isPdf ? (
                /* PDF Görüntüleyici */
                <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  <iframe
                    src={belgeUrl!}
                    className="w-full h-full border-none"
                    title={`${arac.plaka} Ruhsat PDF`}
                  />
                </div>
              ) : (
                /* Görsel Görüntüleyici */
                <div
                  className="transition-transform duration-200 ease-out origin-center w-full max-w-4xl"
                  style={{ transform: `scale(${scale})` }}
                >
                  <div className="relative w-full aspect-[1200/800] rounded-2xl overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <Image
                      src={belgeUrl || "/ruhsat-ornek.svg"}
                      alt={`${arac.plaka} Araç Ruhsat Belgesi`}
                      fill
                      className="object-contain"
                      priority
                      unoptimized={Boolean(belgeUrl?.startsWith("http"))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

