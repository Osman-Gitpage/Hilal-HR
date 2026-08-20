"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  FileCode,
  Info,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface OzelSablon {
  id: string;
  ad: string;
  dosyaTipi: "docx" | "pdf";
  yuklenmeTarihi: string;
  boyut: string;
}

export function AyarlarSablonlarView() {
  const [sablonlar, setSablonlar] = useState<OzelSablon[]>([
    {
      id: "sablon-1",
      ad: "Tersane Özel Kabul & Görevlendirme Formu.docx",
      dosyaTipi: "docx",
      yuklenmeTarihi: "08.08.2026",
      boyut: "245 KB",
    },
    {
      id: "sablon-2",
      ad: "KKD Teslim & Zimmet Taahhütnamesi.pdf",
      dosyaTipi: "pdf",
      yuklenmeTarihi: "05.08.2026",
      boyut: "410 KB",
    },
  ]);

  const [yeniAd, setYeniAd] = useState("");
  const [seciliDosya, setSeciliDosya] = useState<File | null>(null);

  const handleYukle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yeniAd || !seciliDosya) {
      toast.error("Lütfen şablon adı ve dosya seçin.");
      return;
    }

    const tip = seciliDosya.name.endsWith(".pdf") ? "pdf" : "docx";
    const yeniSablon: OzelSablon = {
      id: `sablon-${Date.now()}`,
      ad: `${yeniAd}.${tip}`,
      dosyaTipi: tip,
      yuklenmeTarihi: new Date().toLocaleDateString("tr-TR"),
      boyut: `${(seciliDosya.size / 1024).toFixed(0)} KB`,
    };

    setSablonlar((prev) => [yeniSablon, ...prev]);
    setYeniAd("");
    setSeciliDosya(null);
    toast.success("Özel şablon başarıyla eklendi.");
  };

  const handleSil = (id: string) => {
    setSablonlar((prev) => prev.filter((s) => s.id !== id));
    toast.success("Şablon silindi.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Başlık Kartı */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 dark:from-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1">
        <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
          <FileCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Özel Belge & Evrak Şablonları Paneli
        </h3>
        <p className="text-xs text-muted-foreground">
          Kendi kurumsal `.docx` veya PDF Form şablonlarınızı yükleyebilir, personel ve tersane özlük süreçlerinde dinamik olarak kullanabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sol Kolon: Yeni Şablon Yükle */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-primary" />
            Yeni Özel Şablon Yükle
          </h4>

          <form onSubmit={handleYukle} className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="sablon-adi" className="text-xs">Şablon Adı / Açıklaması *</Label>
              <Input
                id="sablon-adi"
                placeholder="Örn: Özel Taşeron Sözleşmesi"
                value={yeniAd}
                onChange={(e) => setYeniAd(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Şablon Dosyası (.docx veya .pdf) *</Label>
              <label className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-zinc-50/50 dark:bg-zinc-800/20">
                <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs font-medium text-foreground">
                  {seciliDosya ? seciliDosya.name : "Dosya Seçin"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  DOCX veya PDF Form (Max. 15MB)
                </span>
                <input
                  type="file"
                  accept=".docx,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSeciliDosya(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            <Button type="submit" size="sm" className="w-full text-xs font-semibold gap-1.5 h-8">
              <Sparkles className="h-3.5 w-3.5" />
              Şablonu Kaydet
            </Button>
          </form>

          {/* Dinamik Etiket Rehberi */}
          <div className="pt-2 border-t space-y-2">
            <p className="text-[11px] font-semibold flex items-center gap-1 text-muted-foreground">
              <Info className="h-3.5 w-3.5 text-blue-500" />
              Şablonda Kullanılabilir Etiketler:
            </p>
            <div className="flex flex-wrap gap-1">
              {["{ad}", "{soyad}", "{tc}", "{gorev_unvan}", "{ise_baslama_tarihi}", "{sirket_adi}", "{bugun}"].map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Yüklü Şablon Listesi */}
        <div className="md:col-span-7 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-between">
            <span>Tanımlı Şablonlar ({sablonlar.length})</span>
            <Badge variant="outline" className="text-[10px]">Aktif Şablon Kütüphanesi</Badge>
          </h4>

          <div className="space-y-2">
            {sablonlar.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200">{s.ad}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Yüklenme: {s.yuklenmeTarihi} • {s.boyut}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                    {s.dosyaTipi}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    onClick={() => handleSil(s.id)}
                    title="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {sablonlar.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">
                Henüz özel şablon eklenmedi.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
