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
import { policeEkleAction, garajDosyaYukleAction } from "@/app/actions/garaj";
import { toast } from "sonner";
import { Shield, Plus, UploadCloud, FileCheck, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PoliceEkleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aracId: string;
  plaka: string;
  onBasarili?: () => void;
}

export function PoliceEkleModal({
  open,
  onOpenChange,
  aracId,
  plaka,
  onBasarili,
}: PoliceEkleModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const [tur, setTur] = useState("Genişletilmiş Kasko Sigortası");
  const [sirket, setSirket] = useState("Allianz Sigorta");
  const [policeNo, setPoliceNo] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [tutar, setTutar] = useState<number | "">(24500);

  // Opsiyonel Poliçe Belgesi Yükleme
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [belgeAdi, setBelgeAdi] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setBelgeAdi(file.name);
      toast.success(`${file.name} poliçe belgesi seçildi.`);
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

    if (!policeNo.trim() || !bitisTarihi.trim()) {
      toast.error("Lütfen Poliçe Numarası ve Bitiş Tarihi giriniz.");
      return;
    }

    setYukleniyor(true);

    let uploadedUrl: string | undefined = undefined;
    let finalDocName = belgeAdi;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await garajDosyaYukleAction(formData);
      if (uploadRes.basarili && uploadRes.veri) {
        uploadedUrl = uploadRes.veri.url;
        finalDocName = uploadRes.veri.dosyaAdi;
      } else {
        toast.error("Belge yüklenirken bir sorun oluştu, işleme devam ediliyor.");
      }
    }

    const res = await policeEkleAction(aracId, {
      tur: tur.trim(),
      sirket: sirket.trim(),
      policeNo: policeNo.trim().toUpperCase(),
      bitisTarihi,
      tutar: typeof tutar === "number" ? tutar : undefined,
      belgeAdi: finalDocName || undefined,
      belgeUrl: uploadedUrl,
    });

    setYukleniyor(false);

    if (res.basarili) {
      toast.success("Yeni poliçe veritabanına başarıyla kaydedildi.");
      setPoliceNo("");
      setBitisTarihi("");
      setSelectedFile(null);
      setBelgeAdi("");
      onOpenChange(false);
      if (onBasarili) onBasarili();
      router.refresh();
    } else {
      toast.error(res.hata || "Poliçe eklenemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden min-w-0">
        <DialogHeader className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800 text-left min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Sigorta & Kasko Poliçesi Ekle
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {plaka} plakalı araca ait resmi poliçe kaydı
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 text-xs min-w-0">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Poliçe Türü *</Label>
            <Select value={tur} onValueChange={(v) => { if (v) setTur(v); }}>
              <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                <SelectValue placeholder="Poliçe Türü Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Genişletilmiş Kasko Sigortası">
                  Genişletilmiş Kasko Sigortası
                </SelectItem>
                <SelectItem value="Zorunlu Trafik Sigortası">
                  Zorunlu Trafik Sigortası
                </SelectItem>
                <SelectItem value="İMM (İhtiyari Mali Mesuliyet)">
                  İMM (İhtiyari Mali Mesuliyet)
                </SelectItem>
                <SelectItem value="Koltuk Ferdi Kaza Sigortası">
                  Koltuk Ferdi Kaza Sigortası
                </SelectItem>
                <SelectItem value="Yeşil Kart (Uluslararası Sigorta)">
                  Yeşil Kart (Uluslararası Sigorta)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Sigorta Şirketi *</Label>
            <Select value={sirket} onValueChange={(v) => { if (v) setSirket(v); }}>
              <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                <SelectValue placeholder="Şirket Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Allianz Sigorta">Allianz Sigorta</SelectItem>
                <SelectItem value="Aksigorta">Aksigorta</SelectItem>
                <SelectItem value="Anadolu Sigorta">Anadolu Sigorta</SelectItem>
                <SelectItem value="Axa Sigorta">Axa Sigorta</SelectItem>
                <SelectItem value="Türkiye Sigorta">Türkiye Sigorta</SelectItem>
                <SelectItem value="Sompo Sigorta">Sompo Sigorta</SelectItem>
                <SelectItem value="HDI Sigorta">HDI Sigorta</SelectItem>
                <SelectItem value="Mapfre Sigorta">Mapfre Sigorta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Poliçe No *</Label>
              <Input
                placeholder="Örn: KSK-2024-8849"
                value={policeNo}
                onChange={(e) => setPoliceNo(e.target.value)}
                required
                className="rounded-xl h-9 text-xs font-mono uppercase font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Poliçe Bitiş Tarihi *</Label>
              <Input
                type="date"
                value={bitisTarihi}
                onChange={(e) => setBitisTarihi(e.target.value)}
                required
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Poliçe Tutarı (Prim) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Ödenen Prim Tutarı (₺)</Label>
            <Input
              type="number"
              placeholder="Örn: 24500"
              value={tutar}
              onChange={(e) => setTutar(e.target.value ? Number(e.target.value) : "")}
              className="rounded-xl h-9 text-xs font-mono font-bold"
            />
          </div>

          {/* Opsiyonel Poliçe Belgesi Yükleme */}
          <div className="space-y-1.5 pt-1 min-w-0">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Poliçe Belgesi / PDF (Opsiyonel)
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
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-850/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-xs font-medium"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Poliçe Belgesi Yükle (PDF / Görsel)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden pr-2">
                  <FileCheck className="w-4 h-4 shrink-0 text-blue-600" />
                  <span className="font-semibold truncate block min-w-0">{belgeAdi}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFileRemove}
                  className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-zinc-500 hover:text-red-500 transition-colors shrink-0"
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
              className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {yukleniyor ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Poliçeyi Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
