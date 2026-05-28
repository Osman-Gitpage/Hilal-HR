"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSirketStore } from "@/stores/sirketStore";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  LogOut,
  UserPlus,
  User,
  History,
  DollarSign,
  ClipboardList,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonelDetay, useEmploymentPeriods, useMaasGecmisi } from "@/hooks/usePersonelDetay";
import { personelCikisYap, personelYenidenIseAl } from "@/app/actions/personel";
import { formatTarih, formatPara, maskTc, formatAdSoyad } from "@/lib/utils/index";
import { QUERY_KEYS } from "@/lib/constants";
import type { Personel } from "@/supabase/app-types";

// ─────────────────────────────────────────────
// Bilgi Satırı
// ─────────────────────────────────────────────
function BilgiSatiri({ etiket, deger }: { etiket: string; deger: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-2.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground sm:w-40 shrink-0">{etiket}</span>
      <span className="text-sm font-medium">{deger || "-"}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab: Genel Bilgiler
// ─────────────────────────────────────────────
function GenelBilgilerTab({ personel }: { personel: Personel }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 space-y-0.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Kişisel Bilgiler
        </p>
        <BilgiSatiri etiket="TC Kimlik" deger={maskTc(personel.tc)} />
        <BilgiSatiri etiket="Doğum Tarihi" deger={formatTarih(personel.dogum_tarihi)} />
        <BilgiSatiri
          etiket="Cinsiyet"
          deger={
            personel.cinsiyet === "erkek"
              ? "Erkek"
              : personel.cinsiyet === "kadin"
              ? "Kadın"
              : null
          }
        />
        <BilgiSatiri etiket="Telefon" deger={personel.telefon} />
        <BilgiSatiri etiket="E-posta" deger={personel.email} />
        <BilgiSatiri etiket="Adres" deger={personel.adres} />
        <BilgiSatiri etiket="SGK Sicil No" deger={personel.sgk_sicil} />
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-0.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Banka Bilgileri
        </p>
        <BilgiSatiri etiket="Banka Adı" deger={personel.banka_adi} />
        {personel.iban ? (
          <BilgiSatiri etiket="IBAN" deger={personel.iban} />
        ) : (
          <>
            <BilgiSatiri etiket="Şube Kodu" deger={personel.sube_kodu} />
            <BilgiSatiri etiket="Hesap No" deger={personel.hesap_no} />
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab: Çalışma Geçmişi
// ─────────────────────────────────────────────
function CalismaGecmisiTab({ personelId }: { personelId: string }) {
  const { data: periods = [], isLoading } = useEmploymentPeriods(personelId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Çalışma geçmişi bulunamadı.
      </p>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>İşe Giriş</TableHead>
            <TableHead>Çıkış</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Ayrılma Nedeni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((ep) => (
            <TableRow key={ep.id}>
              <TableCell>{formatTarih(ep.baslangic_tarihi)}</TableCell>
              <TableCell>{ep.bitis_tarihi ? formatTarih(ep.bitis_tarihi) : "-"}</TableCell>
              <TableCell>
                {ep.bitis_tarihi === null ? (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary">Çıkış</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {ep.ayrilma_nedeni ?? "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab: Maaş Geçmişi
// ─────────────────────────────────────────────
function MaasGecmisiTab({ personelId }: { personelId: string }) {
  const { data: gecmis = [], isLoading } = useMaasGecmisi(personelId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (gecmis.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Maaş geçmişi bulunamadı.
      </p>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Geçerlilik Başlangıç</TableHead>
            <TableHead>Geçerlilik Bitiş</TableHead>
            <TableHead>Maaş Net</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gecmis.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{formatTarih(m.gecerlilik_baslangic)}</TableCell>
              <TableCell>
                {m.gecerlilik_bitis ? formatTarih(m.gecerlilik_bitis) : "-"}
              </TableCell>
              <TableCell className="font-medium tabular-nums">
                {formatPara(m.maas_net)}
              </TableCell>
              <TableCell>
                {m.gecerlilik_bitis === null ? (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                    Güncel
                  </Badge>
                ) : (
                  <Badge variant="secondary">Geçmiş</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─────────────────────────────────────────────
// Dialog: Yeniden İşe Al
// ─────────────────────────────────────────────
function YenidenIseAlDialog({
  personelId,
  acik,
  onKapat,
}: {
  personelId: string;
  acik: boolean;
  onKapat: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tarih = fd.get("baslama_tarihi") as string;
    const maasStr = fd.get("yeni_maas") as string;
    const yeniMaas = maasStr ? Number(maasStr) : undefined;

    startTransition(async () => {
      const sonuc = await personelYenidenIseAl(personelId, tarih, yeniMaas);
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONEL(personelId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYMENT_PERIODS(personelId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MAAS_GECMISI(personelId) });
      if (sirketId) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONEL_LIST(sirketId) });
      }
      toast.success("Personel yeniden işe alındı.");
      onKapat();
      router.refresh();
    });
  }

  return (
    <Dialog open={acik} onOpenChange={onKapat}>
      <DialogContent className="sm:max-w-sm" id="dialog-yeniden-ise-al">
        <DialogHeader>
          <DialogTitle>Yeniden İşe Al</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="baslama-tarih">Başlama Tarihi *</Label>
            <Input
              id="baslama-tarih"
              name="baslama_tarihi"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yeni-maas">Yeni Maaş Net (₺)</Label>
            <Input
              id="yeni-maas"
              name="yeni_maas"
              type="number"
              min="0"
              step="0.01"
              placeholder="Boş bırakılırsa mevcut maaş korunur"
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onKapat} disabled={isPending}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending} id="btn-yeniden-ise-al-onayla">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              İşe Al
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Dialog: İşten Çıkar
// ─────────────────────────────────────────────
function IstenCikarDialog({
  personelId,
  acik,
  onKapat,
}: {
  personelId: string;
  acik: boolean;
  onKapat: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tarih = fd.get("bitis_tarihi") as string;
    const neden = (fd.get("ayrilma_nedeni") as string).trim();

    if (!tarih) {
      toast.error("Çıkış tarihi zorunludur.");
      return;
    }

    startTransition(async () => {
      const sonuc = await personelCikisYap(personelId, tarih, neden || undefined);
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }

      // TanStack Query cache'ini temizle
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PERSONEL(personelId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.EMPLOYMENT_PERIODS(personelId),
      });
      if (sirketId) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.PERSONEL_LIST(sirketId),
        });
      }

      toast.success("Personel çıkışı başarıyla kaydedildi.");
      onKapat();
      router.push("/personel");
      router.refresh();
    });
  }

  return (
    <Dialog open={acik} onOpenChange={onKapat}>
      <DialogContent className="sm:max-w-sm" id="dialog-isten-cikar">
        <DialogHeader>
          <DialogTitle>İşten Çıkış Kaydı</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cikis-tarih">Çıkış Tarihi *</Label>
            <Input
              id="cikis-tarih"
              name="bitis_tarihi"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cikis-neden">Ayrılma Nedeni</Label>
            <Input
              id="cikis-neden"
              name="ayrilma_nedeni"
              placeholder="İstifa, emeklilik, fesih vb."
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onKapat} disabled={isPending}>
              İptal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              id="btn-cikis-onayla"
            >
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
export function PersonelDetayView({ personelId }: { personelId: string }) {
  const router = useRouter();
  const { data: personel, isLoading, isError } = usePersonelDetay(personelId);
  const { data: periods = [] } = useEmploymentPeriods(personelId);
  const [cikisDialogAcik, setCikisDialogAcik] = useState(false);
  const [yenidenIseAlAcik, setYenidenIseAlAcik] = useState(false);

  // Gerçek aktiflik durumu
  const isAktif = periods.some((ep) => ep.bitis_tarihi === null);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !personel) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>Personel bulunamadı.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/personel")}>
          Listeye Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Geri */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/personel")}
        className="-ml-2"
        id="btn-geri-liste"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Personel Listesi
      </Button>

      {/* Üst Kart */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Sol: Avatar + Bilgiler */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">
                {personel.ad[0]}{personel.soyad[0]}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {formatAdSoyad(personel.ad, personel.soyad)}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {personel.gorev_unvan ?? "Görev belirtilmemiş"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {isAktif ? (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-xs">
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Çıkışlı
                  </Badge>
                )}
                {personel.sgk_sicil && (
                  <span className="text-xs text-muted-foreground">
                    SGK: {personel.sgk_sicil}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sağ: Aksiyonlar */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/personel/${personelId}/duzenle`)}
              id="btn-duzenle"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Düzenle
            </Button>
            {/* Sadece aktif personelde göster */}
            {isAktif && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive border-destructive/30"
                onClick={() => setCikisDialogAcik(true)}
                id="btn-isten-cikar"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                İşten Çıkar
              </Button>
            )}
            {/* Çıkışlı personelde göster */}
            {!isAktif && (
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 hover:text-emerald-600 border-emerald-500/40"
                onClick={() => setYenidenIseAlAcik(true)}
                id="btn-yeniden-ise-al"
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Yeniden İşe Al
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="genel">
        <div className="overflow-x-auto">
          <TabsList className="w-max sm:w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="genel" id="tab-genel" className="gap-1.5">
              <User className="h-3.5 w-3.5" />
              Genel Bilgiler
            </TabsTrigger>
            <TabsTrigger value="calisma" id="tab-calisma" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              Çalışma Geçmişi
            </TabsTrigger>
            <TabsTrigger value="maas" id="tab-maas" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Maaş Geçmişi
            </TabsTrigger>
            <TabsTrigger value="puantaj" id="tab-puantaj" className="gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Puantaj
            </TabsTrigger>
            <TabsTrigger value="evraklar" id="tab-evraklar" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Evraklar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="genel" className="mt-4">
          <GenelBilgilerTab personel={personel} />
        </TabsContent>

        <TabsContent value="calisma" className="mt-4">
          <CalismaGecmisiTab personelId={personelId} />
        </TabsContent>

        <TabsContent value="maas" className="mt-4">
          <MaasGecmisiTab personelId={personelId} />
        </TabsContent>

        <TabsContent value="puantaj" className="mt-4">
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            <ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Puantaj modülü yakında</p>
          </div>
        </TabsContent>

        <TabsContent value="evraklar" className="mt-4">
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Evrak yönetimi yakında</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* İşten Çıkar Dialog */}
      <IstenCikarDialog
        personelId={personelId}
        acik={cikisDialogAcik}
        onKapat={() => setCikisDialogAcik(false)}
      />

      {/* Yeniden İşe Al Dialog */}
      <YenidenIseAlDialog
        personelId={personelId}
        acik={yenidenIseAlAcik}
        onKapat={() => setYenidenIseAlAcik(false)}
      />
    </div>
  );
}
