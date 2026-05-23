"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, TrendingUp, Archive, Plus, UserPlus, Search, MoreHorizontal, Eye, Pencil, LogOut, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { nextSort, compareValues, type SortState } from "@/lib/utils/sort";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/uiStore";
import { usePersonelList, usePersonelKpi, type PersonelListeItem } from "@/hooks/usePersonelList";
import { useSirketStore } from "@/stores/sirketStore";
import { personelCikisYap } from "@/app/actions/personel";
import { QUERY_KEYS } from "@/lib/constants";
import { formatTarih, formatPara, formatAdSoyad } from "@/lib/utils/index";
import { HizliPersonelEkleDialog } from "./HizliPersonelEkleDialog";
import { ExcelSutunSeciciModal } from "@/components/ui/ExcelSutunSeciciModal";
import { personelListesiExport, PERSONEL_TUM_SUTUNLAR, PERSONEL_SUTUN_SETLERI } from "@/lib/excel/personelExport";
import { PdfOnizleButton } from "@/components/ui/PdfOnizleButton";
import { personelPdfOnizle } from "@/lib/pdf/personelPdf";

// ─────────────────────────────────────────────
// KPI Kartları
// ─────────────────────────────────────────────
function KpiKart({
  baslik, deger, ikon: Ikon, renk, yukleniyor,
}: {
  baslik: string; deger: number; ikon: React.ElementType; renk: string; yukleniyor: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{baslik}</CardTitle>
        <div className={`rounded-lg p-2 ${renk}`}>
          <Ikon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        {yukleniyor ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-bold">{deger}</p>}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Yardımcılar
// ─────────────────────────────────────────────
function aktifMi(p: PersonelListeItem) {
  return p.employment_periods.some((ep) => ep.bitis_tarihi === null);
}
function iseGirisTarihi(p: PersonelListeItem): string | null {
  return p.employment_periods.find((ep) => ep.bitis_tarihi === null)?.baslangic_tarihi ?? null;
}
function istenCikisTarihi(p: PersonelListeItem): string | null {
  return (
    p.employment_periods
      .filter((ep) => ep.bitis_tarihi !== null)
      .sort((a, b) => (b.bitis_tarihi ?? "").localeCompare(a.bitis_tarihi ?? ""))[0]?.bitis_tarihi ?? null
  );
}
function aktifMaas(p: PersonelListeItem): number | null {
  return p.maas_gecmisi.find((m) => m.gecerlilik_bitis === null)?.maas_net ?? null;
}

// ─────────────────────────────────────────────
// İşten Çıkar Dialog (liste içi)
// ─────────────────────────────────────────────
function ListeCikisDialog({
  personel,
  onKapat,
}: {
  personel: PersonelListeItem | null;
  onKapat: () => void;
}) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!personel) return;
    const fd = new FormData(e.currentTarget);
    const tarih = fd.get("bitis_tarihi") as string;
    const neden = (fd.get("ayrilma_nedeni") as string | null)?.trim() ?? "";

    startTransition(async () => {
      const sonuc = await personelCikisYap(personel.id, tarih, neden || undefined);
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYMENT_PERIODS(personel.id) });
      if (sirketId) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONEL_LIST(sirketId) });
      }
      toast.success(`${formatAdSoyad(personel.ad, personel.soyad)} çıkışı kaydedildi.`);
      onKapat();
    });
  }

  return (
    <Dialog open={!!personel} onOpenChange={onKapat}>
      <DialogContent className="sm:max-w-sm" id="dialog-liste-cikis">
        <DialogHeader>
          <DialogTitle>
            İşten Çıkış — {personel ? formatAdSoyad(personel.ad, personel.soyad) : ""}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="liste-cikis-tarih">Çıkış Tarihi *</Label>
            <Input
              id="liste-cikis-tarih"
              name="bitis_tarihi"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="liste-cikis-neden">Ayrılma Nedeni</Label>
            <Input
              id="liste-cikis-neden"
              name="ayrilma_nedeni"
              placeholder="İstifa, emeklilik, fesih vb."
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onKapat} disabled={isPending}>
              İptal
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending} id="btn-liste-cikis-onayla">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Çıkışı Onayla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Ana View
// ─────────────────────────────────────────────
type PersonelSortField = "adSoyad" | "gorevUnvan" | "iseGiris" | "maasNet";

function SortIcon({ field, sort }: { field: PersonelSortField; sort: SortState<PersonelSortField> }) {
  if (sort.field !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50 inline" />;
  return sort.dir === "asc"
    ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary inline" />
    : <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary inline" />;
}

export function PersonelListesiView() {
  const router = useRouter();
  const { personelTab, personelArama, setPersonelTab, setPersonelArama, setPersonelEkleAcik } = useUIStore();
  const [cikisPersonel, setCikisPersonel] = useState<PersonelListeItem | null>(null);
  const [sort, setSort] = useState<SortState<PersonelSortField>>({ field: "adSoyad", dir: "asc" });
  const [excelModalAcik, setExcelModalAcik] = useState(false);

  const { data: liste = [], isLoading, isError } = usePersonelList();
  const kpi = usePersonelKpi(liste);

  const aramaLower = personelArama.toLowerCase();
  const filtrelenmis = liste
    .filter((p) => {
      const adSoyad = `${p.ad} ${p.soyad}`.toLowerCase();
      const unvan = (p.gorev_unvan ?? "").toLowerCase();
      const eslesme = !aramaLower || adSoyad.includes(aramaLower) || unvan.includes(aramaLower);
      const durumUyuyor = personelTab === "aktif" ? aktifMi(p) : !aktifMi(p);
      return eslesme && durumUyuyor;
    })
    .sort((a, b) => {
      if (!sort.field) return 0;
      switch (sort.field) {
        case "adSoyad": return compareValues(`${a.ad} ${a.soyad}`, `${b.ad} ${b.soyad}`, sort.dir);
        case "gorevUnvan": return compareValues(a.gorev_unvan, b.gorev_unvan, sort.dir);
        case "iseGiris": return compareValues(iseGirisTarihi(a), iseGirisTarihi(b), sort.dir);
        case "maasNet": return compareValues(aktifMaas(a), aktifMaas(b), sort.dir);
        default: return 0;
      }
    });

  function handleSort(field: PersonelSortField) {
    setSort((s) => nextSort(s, field));
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personel Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Tüm çalışanları görüntüleyin ve yönetin.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button id="btn-hizli-ekle" variant="outline" onClick={() => setPersonelEkleAcik(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Hızlı Ekle
          </Button>
          <Button id="btn-personel-ekle" onClick={() => router.push("/personel/yeni")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Personel Ekle
          </Button>
          <Button
            id="btn-personel-excel"
            variant="outline"
            size="sm"
            onClick={() => setExcelModalAcik(true)}
            disabled={isLoading}
            className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700"
          >
            Excel&#39;e Aktar
          </Button>
          <PdfOnizleButton
            id="btn-personel-pdf"
            baslik="Personel Listesi"
            dosyaAdi={`Personel_Liste`}
            disabled={isLoading || filtrelenmis.length === 0}
            onOlustur={() => personelPdfOnizle(filtrelenmis as never, new Date().getFullYear(), new Date().getMonth() + 1)}
          />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiKart baslik="Aktif Personel" deger={kpi.toplamAktif} ikon={Users} renk="bg-blue-600" yukleniyor={isLoading} />
        <KpiKart baslik="Yeni Bu Ay" deger={kpi.yeniBuAy} ikon={TrendingUp} renk="bg-emerald-600" yukleniyor={isLoading} />
        <KpiKart baslik="Arşiv" deger={kpi.toplamArsiv} ikon={Archive} renk="bg-slate-500" yukleniyor={isLoading} />
      </div>

      {/* Tablo */}
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b">
          <Tabs value={personelTab} onValueChange={(v) => setPersonelTab(v as "aktif" | "arsiv")}>
            <TabsList>
              <TabsTrigger value="aktif" id="tab-aktif">
                Aktif
                {!isLoading && <Badge variant="secondary" className="ml-2">{kpi.toplamAktif}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="arsiv" id="tab-arsiv">
                Arşiv (Çıkışlı)
                {!isLoading && <Badge variant="secondary" className="ml-2">{kpi.toplamArsiv}</Badge>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="input-personel-ara"
              placeholder="Ad, soyad veya unvan..."
              value={personelArama}
              onChange={(e) => setPersonelArama(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {isError ? (
          <div className="p-8 text-center text-destructive text-sm">Veriler yüklenirken hata oluştu.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => handleSort("adSoyad")} className="flex items-center hover:text-foreground transition-colors">
                    Ad Soyad<SortIcon field="adSoyad" sort={sort} />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("gorevUnvan")} className="flex items-center hover:text-foreground transition-colors">
                    Görev / Unvan<SortIcon field="gorevUnvan" sort={sort} />
                  </button>
                </TableHead>
                {personelTab === "aktif" ? (
                  <>
                    <TableHead>
                      <button onClick={() => handleSort("iseGiris")} className="flex items-center hover:text-foreground transition-colors">
                        İşe Giriş<SortIcon field="iseGiris" sort={sort} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => handleSort("maasNet")} className="flex items-center hover:text-foreground transition-colors">
                        Maaş Net<SortIcon field="maasNet" sort={sort} />
                      </button>
                    </TableHead>
                    <TableHead>Durum</TableHead>
                  </>
                ) : (
                  <TableHead>İşten Çıkış</TableHead>
                )}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      {personelTab === "aktif" && (
                        <>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                        </>
                      )}
                      <TableCell />
                    </TableRow>
                  ))
                : filtrelenmis.length === 0
                ? (
                  <TableRow>
                    <TableCell
                      colSpan={personelTab === "aktif" ? 6 : 4}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {personelArama
                        ? "Arama kriterlerine uyan personel bulunamadı."
                        : personelTab === "aktif"
                        ? "Henüz aktif personel yok."
                        : "Arşivde personel yok."}
                    </TableCell>
                  </TableRow>
                )
                : filtrelenmis.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/personel/${p.id}`)}
                  >
                    <TableCell className="font-medium">{formatAdSoyad(p.ad, p.soyad)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.gorev_unvan ?? "-"}</TableCell>
                    {personelTab === "aktif" ? (
                      <>
                        <TableCell>{formatTarih(iseGirisTarihi(p))}</TableCell>
                        <TableCell>{aktifMaas(p) !== null ? formatPara(aktifMaas(p)!) : "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-500 text-emerald-600">Aktif</Badge>
                        </TableCell>
                      </>
                    ) : (
                      <TableCell>{formatTarih(istenCikisTarihi(p))}</TableCell>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          id={`btn-islem-${p.id}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/personel/${p.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Detay
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/personel/${p.id}/duzenle`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          {personelTab === "aktif" && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setCikisPersonel(p)}
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              İşten Çıkar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Hızlı Ekle Dialog */}
      <HizliPersonelEkleDialog />

      {/* İşten Çıkar Dialog */}
      <ListeCikisDialog
        personel={cikisPersonel}
        onKapat={() => setCikisPersonel(null)}
      />

      {/* Excel Sütun Seçici */}
      <ExcelSutunSeciciModal
        acik={excelModalAcik}
        onKapat={() => setExcelModalAcik(false)}
        baslik="Personel Listesi — Excel'e Aktar"
        tumSutunlar={PERSONEL_TUM_SUTUNLAR}
        sutunSetleri={PERSONEL_SUTUN_SETLERI}
        onExport={(sutunlar) => personelListesiExport(liste, { sutunlar })}
      />
    </div>
  );
}
