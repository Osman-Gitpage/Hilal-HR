"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  User,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  ShieldCheck,
  Check,
  Pencil,
  UserPlus,
  FileText,
  Hash,
  Sparkles,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { personelEkle, personelGuncelle } from "@/app/actions/personel";
import { useInvalidatePersonelList } from "@/hooks/usePersonelList";
import { CINSIYET_SECENEKLER } from "@/lib/constants";
import { formatAdSoyad } from "@/lib/utils/index";
import type { Personel, MaasGecmisi, EmploymentPeriod } from "@/supabase/app-types";

interface PersonelFormViewProps {
  mod: "yeni" | "duzenle";
  personel?: Personel;
  aktifMaas?: MaasGecmisi | null;
  aktifPeriod?: EmploymentPeriod | null;
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

  const isEdit = mod === "duzenle";
  const baslik = isEdit ? "Personel Düzenle" : "Yeni Personel Ekle";
  const adSoyad = personel ? formatAdSoyad(personel.ad, personel.soyad) : "";
  const initials = personel
    ? `${personel.ad[0] ?? ""}${personel.soyad[0] ?? ""}`.toUpperCase()
    : "";

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
          ? "Personel kaydı başarıyla oluşturuldu!"
          : "Personel bilgileri güncellendi!"
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Üst Header Banner ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              id="btn-geri"
              className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {isEdit ? (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                {initials || <User className="w-6 h-6" />}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight leading-snug">
                  {isEdit ? (adSoyad || baslik) : baslik}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    isEdit
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800 text-[11px]"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px]"
                  }
                >
                  {isEdit ? "Düzenleme Modu" : "Yeni Kayıt"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isEdit
                  ? "Personelin kişisel, iletişim, istihdam ve banka bilgilerini düzenleyin."
                  : "Sisteme yeni bir çalışan eklemek için aşağıdaki formu doldurun."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              disabled={isPending}
              className="h-9 px-4 rounded-xl text-xs font-medium cursor-pointer"
            >
              İptal
            </Button>
            <Button
              form="personel-form"
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1.5" />
              )}
              {isEdit ? "Değişiklikleri Kaydet" : "Kaydet ve Tamamla"}
            </Button>
          </div>
        </div>

        {/* ── Form Alanı ── */}
        <form id="personel-form" onSubmit={handleSubmit} className="space-y-6">
          {/* 1. KİŞİSEL BİLGİLER */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Kişisel Bilgiler
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Kimlik ve temel kişisel bilgileri girin.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="form-ad" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Ad <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="form-ad"
                  name="ad"
                  defaultValue={personel?.ad}
                  placeholder="Mehmet"
                  required
                  maxLength={50}
                  onInput={(e) => {
                    // Sayı, emoji ve özel sembolleri engelle
                    e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s'-]/g, "");
                  }}
                  disabled={isPending}
                  className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="form-soyad" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Soyad <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="form-soyad"
                  name="soyad"
                  defaultValue={personel?.soyad}
                  placeholder="Yılmaz"
                  required
                  maxLength={50}
                  onInput={(e) => {
                    // Sayı, emoji ve özel sembolleri engelle
                    e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s'-]/g, "");
                  }}
                  disabled={isPending}
                  className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="form-tc" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  TC Kimlik No <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="form-tc"
                    name="tc"
                    defaultValue={personel?.tc}
                    placeholder="12345678901"
                    maxLength={11}
                    inputMode="numeric"
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 11);
                    }}
                    required
                    disabled={isPending}
                    className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm pl-9 focus-visible:ring-indigo-500 font-mono tracking-wider"
                  />
                  <Hash className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="form-dogum-tarihi" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Doğum Tarihi (14 - 95 Yaş)
                </Label>
                <Input
                  id="form-dogum-tarihi"
                  name="dogum_tarihi"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  defaultValue={personel?.dogum_tarihi ?? ""}
                  disabled={isPending}
                  className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="form-cinsiyet" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Cinsiyet
                </Label>
                <Select
                  name="cinsiyet"
                  defaultValue={personel?.cinsiyet ?? ""}
                  disabled={isPending}
                >
                  <SelectTrigger id="form-cinsiyet" className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CINSIYET_SECENEKLER.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 2. GÖREV VE İLETİŞİM BİLGİLERİ */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Görev ve İletişim Bilgileri
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Unvan, SGK numarası ve iletişim kanallarını tanımlayın.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="form-gorev-unvan" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Görev / Unvan
                </Label>
                <Input
                  id="form-gorev-unvan"
                  name="gorev_unvan"
                  defaultValue={personel?.gorev_unvan ?? ""}
                  placeholder="Mühendis, Tekniker, vb."
                  disabled={isPending}
                  className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-sgk-sicil" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  SGK Sicil No
                </Label>
                <Input
                  id="form-sgk-sicil"
                  name="sgk_sicil"
                  defaultValue={personel?.sgk_sicil ?? ""}
                  placeholder="1234567890"
                  disabled={isPending}
                  className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="form-telefon" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Telefon Numarası
                </Label>
                <div className="relative">
                  <Input
                    id="form-telefon"
                    name="telefon"
                    defaultValue={personel?.telefon ?? ""}
                    placeholder="0555 123 45 67"
                    disabled={isPending}
                    className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm pl-9 focus-visible:ring-indigo-500"
                  />
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-email" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  E-posta Adresi
                </Label>
                <div className="relative">
                  <Input
                    id="form-email"
                    name="email"
                    type="email"
                    defaultValue={personel?.email ?? ""}
                    placeholder="ornek@sirket.com"
                    disabled={isPending}
                    className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm pl-9 focus-visible:ring-indigo-500"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-adres" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Açık Adres
              </Label>
              <div className="relative">
                <Input
                  id="form-adres"
                  name="adres"
                  defaultValue={personel?.adres ?? ""}
                  placeholder="İl, İlçe, Mahalle, Cadde/Sokak No"
                  disabled={isPending}
                  className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm pl-9 focus-visible:ring-indigo-500"
                />
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 3. İSTİHDAM VEYA FİNANS BİLGİLERİ */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    İstihdam ve Maaş Bilgileri
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Başlangıç tarihi ve aylık net ücret.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mod === "yeni" && (
                <div className="space-y-1.5">
                  <Label htmlFor="form-ise-baslama" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    İşe Giriş Tarihi <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="form-ise-baslama"
                    name="ise_baslama_tarihi"
                    type="date"
                    defaultValue={aktifPeriod?.baslangic_tarihi ?? ""}
                    required={mod === "yeni"}
                    disabled={isPending}
                    className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-indigo-500"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="form-maas-net" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Net Maaş (₺) <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="form-maas-net"
                    name="maas_net"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={aktifMaas?.maas_net ?? ""}
                    placeholder="30000"
                    required
                    disabled={isPending}
                    className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm pl-8 focus-visible:ring-indigo-500 font-semibold text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-400">₺</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. BANKA BİLGİLERİ */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Banka Hesap Bilgileri
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Bordro ödemelerinin aktarılacağı hesap detayları.
                  </p>
                </div>
              </div>

              {/* Segmented Toggle Control */}
              <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBankaModu("iban")}
                  id="btn-form-banka-iban"
                  disabled={isPending}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    bankaModu === "iban"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  IBAN ile
                </button>
                <button
                  type="button"
                  onClick={() => setBankaModu("hesap")}
                  id="btn-form-banka-hesap"
                  disabled={isPending}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    bankaModu === "hesap"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Şube + Hesap No
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="form-banka-adi" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Banka Adı
                </Label>
                <div className="relative">
                  <Input
                    id="form-banka-adi"
                    name="banka_adi"
                    defaultValue={personel?.banka_adi ?? ""}
                    placeholder="Ziraat Bankası, Garanti BBVA, vb."
                    disabled={isPending}
                    className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm pl-9 focus-visible:ring-indigo-500"
                  />
                  <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {bankaModu === "iban" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="form-iban" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    IBAN Numarası
                  </Label>
                  <Input
                    id="form-iban"
                    name="iban"
                    defaultValue={personel?.iban ?? ""}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    disabled={isPending}
                    className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-indigo-500 font-mono tracking-wider"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="form-sube-kodu" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Şube Kodu
                    </Label>
                    <Input
                      id="form-sube-kodu"
                      name="sube_kodu"
                      defaultValue={personel?.sube_kodu ?? ""}
                      placeholder="0001"
                      disabled={isPending}
                      className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="form-hesap-no" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Hesap Numarası
                    </Label>
                    <Input
                      id="form-hesap-no"
                      name="hesap_no"
                      defaultValue={personel?.hesap_no ?? ""}
                      placeholder="1234567890"
                      disabled={isPending}
                      className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alt Sabit / Esnek Aksiyon Barı */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
              className="h-11 px-6 rounded-xl text-sm font-medium border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              id="btn-personel-kaydet"
              className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md cursor-pointer transition-all"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {isEdit ? "Değişiklikleri Kaydet" : "Personel Ekle"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
