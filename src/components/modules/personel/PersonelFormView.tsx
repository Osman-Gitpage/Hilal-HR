"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { personelEkle, personelGuncelle } from "@/app/actions/personel";
import { useInvalidatePersonelList } from "@/hooks/usePersonelList";
import { CINSIYET_SECENEKLER } from "@/lib/constants";
import type { Personel, MaasGecmisi, EmploymentPeriod } from "@/supabase/app-types";

interface PersonelFormViewProps {
  mod: "yeni" | "duzenle";
  personel?: Personel;
  aktifMaas?: MaasGecmisi | null;
  aktifPeriod?: EmploymentPeriod | null;
}

// Bölüm başlığı
function BolumBasligi({ baslik }: { baslik: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {baslik}
      </h2>
      <Separator className="mt-2" />
    </div>
  );
}

export function PersonelFormView({
  mod,
  personel,
  aktifMaas,
  aktifPeriod,
}: PersonelFormViewProps) {
  const router = useRouter();
  const invalidate = useInvalidatePersonelList();
  const [isPending, startTransition] = useTransition();
  const [bankaModu, setBankaModu] = useState<"iban" | "hesap">(
    personel?.iban ? "iban" : personel?.sube_kodu ? "hesap" : "iban"
  );

  const baslik = mod === "yeni" ? "Personel Ekle" : "Personel Düzenle";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let sonuc: { hata?: string; basarili?: boolean; personelId?: string };

      if (mod === "yeni") {
        sonuc = await personelEkle(formData);
      } else {
        sonuc = await personelGuncelle(personel!.id, formData);
      }

      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }

      toast.success(
        mod === "yeni"
          ? "Personel başarıyla eklendi!"
          : "Personel güncellendi!"
      );
      invalidate();

      const hedefId = mod === "yeni" ? sonuc.personelId : personel?.id;
      if (hedefId) {
        router.push(`/personel/${hedefId}`);
      } else {
        router.push("/personel");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Geri + Başlık */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          id="btn-geri"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{baslik}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {mod === "yeni"
              ? "Yeni bir çalışan kaydı oluşturun."
              : "Mevcut çalışan bilgilerini güncelleyin."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* KİŞİSEL BİLGİLER */}
        <div className="space-y-4">
          <BolumBasligi baslik="Kişisel Bilgiler" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="form-ad">Ad *</Label>
              <Input
                id="form-ad"
                name="ad"
                defaultValue={personel?.ad}
                placeholder="Mehmet"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-soyad">Soyad *</Label>
              <Input
                id="form-soyad"
                name="soyad"
                defaultValue={personel?.soyad}
                placeholder="Yılmaz"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-tc">TC Kimlik No *</Label>
            <Input
              id="form-tc"
              name="tc"
              defaultValue={personel?.tc}
              placeholder="12345678901"
              maxLength={11}
              required
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="form-dogum-tarihi">Doğum Tarihi</Label>
              <Input
                id="form-dogum-tarihi"
                name="dogum_tarihi"
                type="date"
                defaultValue={personel?.dogum_tarihi ?? ""}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-cinsiyet">Cinsiyet</Label>
              <Select
                name="cinsiyet"
                defaultValue={personel?.cinsiyet ?? ""}
                disabled={isPending}
              >
                <SelectTrigger id="form-cinsiyet">
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {CINSIYET_SECENEKLER.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="form-sgk-sicil">SGK Sicil No</Label>
              <Input
                id="form-sgk-sicil"
                name="sgk_sicil"
                defaultValue={personel?.sgk_sicil ?? ""}
                placeholder="SGK sicil numarası"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-gorev-unvan">Görev / Unvan</Label>
              <Input
                id="form-gorev-unvan"
                name="gorev_unvan"
                defaultValue={personel?.gorev_unvan ?? ""}
                placeholder="Saha Teknisyeni"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="form-telefon">Telefon</Label>
              <Input
                id="form-telefon"
                name="telefon"
                defaultValue={personel?.telefon ?? ""}
                placeholder="0555 123 45 67"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-email">E-posta</Label>
              <Input
                id="form-email"
                name="email"
                type="email"
                defaultValue={personel?.email ?? ""}
                placeholder="mehmet@sirket.com"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-adres">Adres</Label>
            <Input
              id="form-adres"
              name="adres"
              defaultValue={personel?.adres ?? ""}
              placeholder="Tam adres"
              disabled={isPending}
            />
          </div>
        </div>

        {/* İSTİHDAM BİLGİLERİ */}
        <div className="space-y-4">
          <BolumBasligi baslik="İstihdam Bilgileri" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mod === "yeni" && (
              <div className="space-y-1.5">
                <Label htmlFor="form-ise-baslama">İşe Giriş Tarihi *</Label>
                <Input
                  id="form-ise-baslama"
                  name="ise_baslama_tarihi"
                  type="date"
                  defaultValue={aktifPeriod?.baslangic_tarihi ?? ""}
                  required={mod === "yeni"}
                  disabled={isPending}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="form-maas-net">Maaş Net (₺) *</Label>
              <Input
                id="form-maas-net"
                name="maas_net"
                type="number"
                min="0"
                step="0.01"
                defaultValue={aktifMaas?.maas_net ?? ""}
                placeholder="25000"
                required
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        {/* BANKA BİLGİLERİ */}
        <div className="space-y-4">
          <BolumBasligi baslik="Banka Bilgileri" />
          <p className="text-xs text-muted-foreground -mt-2">
            IBAN <strong>veya</strong> Şube Kodu + Hesap No girmek yeterlidir.
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={bankaModu === "iban" ? "default" : "outline"}
              onClick={() => setBankaModu("iban")}
              id="btn-form-banka-iban"
              disabled={isPending}
            >
              IBAN ile gir
            </Button>
            <Button
              type="button"
              size="sm"
              variant={bankaModu === "hesap" ? "default" : "outline"}
              onClick={() => setBankaModu("hesap")}
              id="btn-form-banka-hesap"
              disabled={isPending}
            >
              Şube + Hesap No ile gir
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-banka-adi">Banka Adı</Label>
            <Input
              id="form-banka-adi"
              name="banka_adi"
              defaultValue={personel?.banka_adi ?? ""}
              placeholder="Ziraat Bankası"
              disabled={isPending}
            />
          </div>

          {bankaModu === "iban" ? (
            <div className="space-y-1.5">
              <Label htmlFor="form-iban">IBAN</Label>
              <Input
                id="form-iban"
                name="iban"
                defaultValue={personel?.iban ?? ""}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                disabled={isPending}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="form-sube-kodu">Şube Kodu</Label>
                <Input
                  id="form-sube-kodu"
                  name="sube_kodu"
                  defaultValue={personel?.sube_kodu ?? ""}
                  placeholder="0001"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="form-hesap-no">Hesap No</Label>
                <Input
                  id="form-hesap-no"
                  name="hesap_no"
                  defaultValue={personel?.hesap_no ?? ""}
                  placeholder="1234567890"
                  disabled={isPending}
                />
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isPending} id="btn-personel-kaydet">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mod === "yeni" ? "Personel Ekle" : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
