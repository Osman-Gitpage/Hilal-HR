"use client";

import { useState, useRef, useEffect } from "react";
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
import { muayeneGuncelleAction, garajDosyaYukleAction } from "@/app/actions/garaj";
import { toast } from "sonner";
import { Calendar, CheckCircle2, UploadCloud, FileCheck, X, Loader2 } from "lucide-react";
import { MuayeneBilgileri } from "./types";
import { useRouter } from "next/navigation";

interface MuayeneGuncelleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aracId: string;
  plaka: string;
  mevcutMuayene?: MuayeneBilgileri;
  onBasarili?: () => void;
}

export function MuayeneGuncelleModal({
  open,
  onOpenChange,
  aracId,
  plaka,
  mevcutMuayene,
  onBasarili,
}: MuayeneGuncelleModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const [muayeneTarihi, setMuayeneTarihi] = useState("2026-06-18");
  const [istasyon, setIstasyon] = useState("TÜVTÜRK Maslak İstasyonu");
  const [raporNo, setRaporNo] = useState("TUV-2024-991840");
  const [sonuc, setSonuc] = useState("Kusursuz Geçti");
  const [egzozEmisyonTarihi, setEgzozEmisyonTarihi] = useState("2026-06-18");
  const [muayeneUcreti, setMuayeneUcreti] = useState<number | "">(2620);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [belgeAdi, setBelgeAdi] = useState<string>("");

  useEffect(() => {
    if (mevcutMuayene) {
      if (mevcutMuayene.muayeneTarihi.includes(".")) {
        const parts = mevcutMuayene.muayeneTarihi.split(".");
        if (parts.length === 3) {
          setMuayeneTarihi(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      } else {
        setMuayeneTarihi(mevcutMuayene.muayeneTarihi);
      }

      setIstasyon(mevcutMuayene.istasyon || "TÜVTÜRK Maslak İstasyonu");
      setRaporNo(mevcutMuayene.raporNo || "TUV-2024-991840");
      setSonuc(mevcutMuayene.sonuc || "Kusursuz Geçti");
      setMuayeneUcreti(mevcutMuayene.muayeneUcreti ?? 2620);

      if (mevcutMuayene.egzozEmisyonTarihi) {
        if (mevcutMuayene.egzozEmisyonTarihi.includes(".")) {
          const eParts = mevcutMuayene.egzozEmisyonTarihi.split(".");
          if (eParts.length === 3) {
            setEgzozEmisyonTarihi(`${eParts[2]}-${eParts[1]}-${eParts[0]}`);
          }
        } else {
          setEgzozEmisyonTarihi(mevcutMuayene.egzozEmisyonTarihi);
        }
      }
      setBelgeAdi(mevcutMuayene.belgeAdi || "");
    }
  }, [mevcutMuayene, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setBelgeAdi(file.name);
      toast.success(`${file.name} muayene raporu seçildi.`);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setBelgeAdi("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!muayeneTarihi.trim()) {
      toast.error("Lütfen Geçerlilik Tarihi giriniz.");
      return;
    }

    setYukleniyor(true);

    let uploadedUrl: string | undefined = mevcutMuayene?.belgeUrl;
    let finalDocName = belgeAdi;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
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
      istasyon: istasyon.trim(),
      raporNo: raporNo.trim(),
      sonuc,
      egzozEmisyonTarihi,
      belgeAdi: finalDocName || undefined,
      belgeUrl: uploadedUrl,
    });

    setYukleniyor(false);

    if (res.basarili) {
      toast.success("TÜVTÜRK muayene bilgileri veritabanında güncellendi.");
      onOpenChange(false);
      if (onBasarili) onBasarili();
      router.refresh();
    } else {
      toast.error(res.hata || "Muayene güncellenemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden min-w-0">
        <DialogHeader className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800 text-left min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              TÜVTÜRK Muayene & Emisyon Güncelle
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {plaka} plakalı aracın periyodik muayene ve egzoz kaydı
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 text-xs min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Muayene Geçerlilik *</Label>
              <Input
                type="date"
                value={muayeneTarihi}
                onChange={(e) => setMuayeneTarihi(e.target.value)}
                required
                className="rounded-xl h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Egzoz Emisyon Tarihi</Label>
              <Input
                type="date"
                value={egzozEmisyonTarihi}
                onChange={(e) => setEgzozEmisyonTarihi(e.target.value)}
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Muayene & Egzoz Ücreti (₺)</Label>
              <Input
                type="number"
                placeholder="Örn: 2620"
                value={muayeneUcreti}
                onChange={(e) => setMuayeneUcreti(e.target.value ? Number(e.target.value) : "")}
                className="rounded-xl h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Muayene Sonucu</Label>
              <Select value={sonuc} onValueChange={(v) => { if (v) setSonuc(v); }}>
                <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Sonuç Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kusursuz Geçti">Kusursuz Geçti</SelectItem>
                  <SelectItem value="Hafif Kusurlu Geçti">Hafif Kusurlu Geçti</SelectItem>
                  <SelectItem value="Ağır Kusurlu (Kaldı)">Ağır Kusurlu (Kaldı)</SelectItem>
                  <SelectItem value="Emniyetsiz">Emniyetsiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">İstasyon</Label>
              <Input
                placeholder="Örn: TÜVTÜRK Maslak"
                value={istasyon}
                onChange={(e) => setIstasyon(e.target.value)}
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Rapor / Belge No</Label>
              <Input
                placeholder="TUV-2024-9918"
                value={raporNo}
                onChange={(e) => setRaporNo(e.target.value)}
                className="rounded-xl h-9 text-xs font-mono uppercase"
              />
            </div>
          </div>

          {/* Opsiyonel Muayene Raporu / Belgesi Yükleme */}
          <div className="space-y-1.5 pt-1 min-w-0">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              TÜVTÜRK Muayene Raporu / Belgesi (Opsiyonel)
            </Label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,image/*"
              className="hidden"
            />

            {!belgeAdi ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-850/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-xs font-medium"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Rapor Belgesi Yükle (PDF / Görsel)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden pr-2">
                  <FileCheck className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span className="font-semibold truncate block min-w-0">{belgeAdi}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFileRemove}
                  className="p-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 text-zinc-500 hover:text-red-500 transition-colors shrink-0"
                  title="Belgeyi Kaldır"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              disabled={yukleniyor}
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9 px-4"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={yukleniyor}
              className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {yukleniyor ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Kaydı Güncelle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
