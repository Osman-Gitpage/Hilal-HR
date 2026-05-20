"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Ship,
  Calendar,
  Clock,
  Users,
  FileText,
  History,
  Circle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Tag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useProjeDetay,
  useProjeDonemLog,
  useProjeDonemLogEkle,
  useProjeDonemLogGuncelle,
  useProjeDonemLogSil,
  type DonemLog,
} from "@/hooks/usePuantaj";

// ─────────────────────────────────────────────
// Yardımcı
// ─────────────────────────────────────────────
function formatTarih(tarih: string) {
  return new Date(tarih + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatAy(ayKey: string) {
  const [yil, ay] = ayKey.split("-");
  const ayAdlari = [
    "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  return `${ayAdlari[parseInt(ay)]} ${yil}`;
}

// ─────────────────────────────────────────────
// Stat Kartı
// ─────────────────────────────────────────────
function StatKart({ ikon, etiket, deger, renk }: {
  ikon: React.ReactNode;
  etiket: string;
  deger: string | number;
  renk?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${renk ?? "bg-primary/10 text-primary"}`}>
        {ikon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{etiket}</p>
        <p className="text-xl font-bold tabular-nums">{deger}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Dönem Log Paneli (standalone, detay sayfasına özel)
// ─────────────────────────────────────────────
function DonemTimeline({ projeId }: { projeId: string }) {
  const { data: loglar = [], isLoading } = useProjeDonemLog(projeId);
  const ekle = useProjeDonemLogEkle(projeId);
  const guncelle = useProjeDonemLogGuncelle(projeId);
  const sil = useProjeDonemLogSil(projeId);
  const [formAcik, setFormAcik] = useState(false);
  const [form, setForm] = useState({ baslangic: "", bitis: "", aciklama: "" });
  const [duzenlenen, setDuzenlenen] = useState<DonemLog | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEkle() {
    if (!form.baslangic) { toast.error("Başlangıç tarihi zorunludur."); return; }
    startTransition(async () => {
      const sonuc = await ekle.mutateAsync({ baslangic: form.baslangic, bitis: form.bitis || null, aciklama: form.aciklama || null });
      if (sonuc?.hata) { toast.error(sonuc.hata); return; }
      toast.success("Dönem eklendi.");
      setForm({ baslangic: "", bitis: "", aciklama: "" });
      setFormAcik(false);
    });
  }

  function handleGuncelle(log: DonemLog) {
    if (!duzenlenen) return;
    startTransition(async () => {
      const sonuc = await guncelle.mutateAsync({ logId: log.id, bitis: duzenlenen.bitis, aciklama: duzenlenen.aciklama });
      if (sonuc?.hata) { toast.error(sonuc.hata); return; }
      toast.success("Dönem güncellendi.");
      setDuzenlenen(null);
    });
  }

  function handleSil(logId: string) {
    startTransition(async () => {
      const sonuc = await sil.mutateAsync({ logId });
      if (sonuc?.hata) { toast.error(sonuc.hata); return; }
      toast.success("Dönem silindi.");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <History className="h-4 w-4 text-muted-foreground" />
          Çalışma Dönemleri
        </p>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setFormAcik(v => !v)} id="btn-donem-ekle">
          <Plus className="h-3.5 w-3.5" /> Dönem Ekle
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : loglar.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz dönem kaydı yok.</p>
      ) : (
        <div className="relative space-y-0 pl-5">
          {/* Dikey çizgi */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
          {loglar.map((log, idx) => {
            const aktif = !log.bitis;
            const isDuzenleniyor = duzenlenen?.id === log.id;
            return (
              <div key={log.id} className="relative flex items-start gap-3 pb-5 group">
                <div className={`absolute -left-[1px] mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-background z-10 ${aktif ? "border-emerald-500" : "border-border"}`}>
                  {aktif
                    ? <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                    : <CheckCircle2 className="h-2.5 w-2.5 text-muted-foreground/40" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5 ml-1">
                  {isDuzenleniyor ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input type="date" value={duzenlenen.bitis ?? ""} onChange={e => setDuzenlenen({ ...duzenlenen, bitis: e.target.value || null })} className="h-7 w-36 text-xs" />
                      <Input placeholder="Açıklama" value={duzenlenen.aciklama ?? ""} onChange={e => setDuzenlenen({ ...duzenlenen, aciklama: e.target.value })} className="h-7 flex-1 text-xs" />
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleGuncelle(log)} disabled={isPending}>Kaydet</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDuzenlenen(null)}>İptal</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium tabular-nums">
                        {formatTarih(log.baslangic)}
                        <span className="text-muted-foreground mx-2">→</span>
                        {log.bitis
                          ? <span className="font-normal text-muted-foreground">{formatTarih(log.bitis)}</span>
                          : <span className="text-emerald-600 font-semibold">devam ediyor</span>}
                      </span>
                      {log.aciklama && <span className="text-xs text-muted-foreground">{log.aciklama}</span>}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDuzenlenen({ ...log })} id={`btn-log-duzenle-${log.id}`}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => handleSil(log.id)} disabled={isPending} id={`btn-log-sil-${log.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formAcik && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">Yeni Dönem</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Başlangıç *</Label>
              <Input type="date" value={form.baslangic} onChange={e => setForm(f => ({ ...f, baslangic: e.target.value }))} className="h-8 text-xs" id="input-yeni-donem-baslangic" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bitiş (boş = devam ediyor)</Label>
              <Input type="date" value={form.bitis} onChange={e => setForm(f => ({ ...f, bitis: e.target.value }))} className="h-8 text-xs" id="input-yeni-donem-bitis" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Açıklama</Label>
              <Input placeholder="Opsiyonel…" value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} className="h-8 text-xs" id="input-yeni-donem-aciklama" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={handleEkle} disabled={isPending} id="btn-yeni-donem-kaydet">
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />} Ekle
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFormAcik(false)}>İptal</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Ana Bileşen
// ─────────────────────────────────────────────
export function ProjeDetayView({ projeId }: { projeId: string }) {
  const { data, isLoading, isError } = useProjeDetay(projeId);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-destructive">
        <p className="text-lg font-semibold">Proje bulunamadı veya erişim yetkiniz yok.</p>
        <Link href="/puantaj/projeler">
          <Button variant="outline" size="sm">← Projelere Dön</Button>
        </Link>
      </div>
    );
  }

  const { proje, donemLoglar: _dl, aylikOzet, personeller, toplamSaat } = data;
  const aktifDonem = !proje.bitis_tarihi;
  const faturaKodlari: { kod: string; aciklama?: string }[] = proje.fatura_kodlari ?? [];

  return (
    <div className="space-y-6">
      {/* Üst Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/puantaj/projeler">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" id="btn-geri-projeler">
            <ArrowLeft className="h-4 w-4" />
            Projeler
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold truncate">{proje.ad}</span>
        <Badge variant={aktifDonem ? "default" : "secondary"} className="ml-auto">
          {aktifDonem ? "Aktif" : "Arşiv"}
        </Badge>
      </div>

      {/* Başlık Kartı */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{proje.ad}</h1>
            {proje.firma_adi && (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {proje.firma_adi}
              </p>
            )}
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground pt-1">
              {proje.bolge && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {proje.bolge}
                </span>
              )}
              {proje.tersane_adi && (
                <span className="flex items-center gap-1.5">
                  <Ship className="h-3.5 w-3.5" /> {proje.tersane_adi}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Başlangıç: {formatTarih(proje.baslangic_tarihi)}
              </span>
              {proje.bitis_tarihi && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Bitiş: {formatTarih(proje.bitis_tarihi)}
                </span>
              )}
            </div>
          </div>
        </div>
        {proje.aciklama && (
          <p className="mt-4 text-sm text-muted-foreground border-t pt-4">{proje.aciklama}</p>
        )}
      </div>

      {/* Stat Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKart
          ikon={<Clock className="h-5 w-5" />}
          etiket="Toplam Saat"
          deger={`${toplamSaat.toFixed(1)} sa`}
          renk="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        />
        <StatKart
          ikon={<Users className="h-5 w-5" />}
          etiket="Çalışan Personel"
          deger={personeller.length}
          renk="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
        />
        <StatKart
          ikon={<TrendingUp className="h-5 w-5" />}
          etiket="Aktif Ay Sayısı"
          deger={aylikOzet.length}
          renk="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        />
        <StatKart
          ikon={<Tag className="h-5 w-5" />}
          etiket="Fatura Kodu"
          deger={faturaKodlari.length}
          renk="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon — Dönem Logları */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dönem Timeline */}
          <div className="rounded-xl border bg-card p-5">
            <DonemTimeline projeId={projeId} />
          </div>

          {/* Aylık Özet Tablosu */}
          {aylikOzet.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Aylık Çalışma Özeti</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dönem</TableHead>
                    <TableHead className="text-right">Toplam Saat</TableHead>
                    <TableHead className="text-right">Personel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aylikOzet.map(({ ay, toplamSaat: ts, personelSayisi }) => (
                    <TableRow key={ay}>
                      <TableCell className="font-medium">{formatAy(ay)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="font-semibold">{ts.toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs ml-1">sa</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <Badge variant="outline" className="text-xs">{personelSayisi} kişi</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Sağ Kolon */}
        <div className="space-y-6">
          {/* Personeller */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Çalışan Personeller
            </h3>
            {personeller.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz kayıt yok.</p>
            ) : (
              <div className="space-y-2">
                {personeller.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {p.ad.charAt(0)}{p.soyad.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.ad} {p.soyad}</p>
                      {p.gorev_unvan && (
                        <p className="text-[11px] text-muted-foreground truncate">{p.gorev_unvan}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fatura Kodları */}
          {faturaKodlari.length > 0 && (
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Fatura Kodları
              </h3>
              <div className="space-y-1.5">
                {faturaKodlari.map((fk: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{fk.kod}</Badge>
                    {fk.aciklama && (
                      <span className="text-xs text-muted-foreground truncate">{fk.aciklama}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adres Bilgisi */}
          {(proje.adres_1 || proje.adres_2) && (
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Adres
              </h3>
              {proje.adres_1 && <p className="text-sm">{proje.adres_1}</p>}
              {proje.adres_2 && <p className="text-sm text-muted-foreground">{proje.adres_2}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
