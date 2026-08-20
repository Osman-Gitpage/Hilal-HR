"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { personelEkle } from "@/app/actions/personel";
import { useInvalidatePersonelList } from "@/hooks/usePersonelList";
import { tcKimlikDogrula } from "@/lib/utils/index";

export function HizliPersonelEkleDialog() {
  const router = useRouter();
  const { personelEkleAcik, setPersonelEkleAcik } = useUIStore();
  const invalidate = useInvalidatePersonelList();
  const [isPending, startTransition] = useTransition();

  // Banka modu: iban | hesap
  const [bankaModu, setBankaModu] = useState<"iban" | "hesap">("iban");

  // TC Kimlik No doğrulama state'i
  const [tcDegeri, setTcDegeri] = useState("");
  const tcHatasi = tcDegeri.length > 0 ? tcKimlikDogrula(tcDegeri) : "";
  const tcGecerli = tcDegeri.length === 11 && tcHatasi === "";

  function handleClose() {
    if (!isPending) {
      setPersonelEkleAcik(false);
      setTcDegeri("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side TC kontrolü
    const tcHata = tcKimlikDogrula(tcDegeri);
    if (tcHata) {
      toast.error(tcHata);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("banka_modu", bankaModu);

    startTransition(async () => {
      const sonuc = await personelEkle(formData);
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Personel başarıyla eklendi!");
      invalidate();
      setPersonelEkleAcik(false);
      setTcDegeri("");
      if (sonuc?.personelId) {
        router.push(`/personel/${sonuc.personelId}`);
      }
    });
  }

  return (
    <Dialog open={personelEkleAcik} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" id="dialog-hizli-personel-ekle">
        <DialogHeader>
          <DialogTitle>Hızlı Personel Ekle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ad — Soyad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hizli-ad">Ad *</Label>
              <Input
                id="hizli-ad"
                name="ad"
                placeholder="Mehmet"
                maxLength={50}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s'-]/g, "");
                }}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hizli-soyad">Soyad *</Label>
              <Input
                id="hizli-soyad"
                name="soyad"
                placeholder="Yılmaz"
                maxLength={50}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s'-]/g, "");
                }}
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* TC */}
          <div className="space-y-1.5">
            <Label htmlFor="hizli-tc">TC Kimlik No *</Label>
            <div className="relative">
              <Input
                id="hizli-tc"
                name="tc"
                placeholder="12345678901"
                maxLength={11}
                inputMode="numeric"
                pattern="\d{11}"
                value={tcDegeri}
                onChange={(e) => setTcDegeri(e.target.value.replace(/\D/g, ""))}
                required
                disabled={isPending}
                className={
                  tcDegeri.length === 0
                    ? ""
                    : tcGecerli
                    ? "border-emerald-500 pr-9 focus-visible:ring-emerald-500"
                    : "border-rose-500 pr-9 focus-visible:ring-rose-500"
                }
              />
              {tcDegeri.length > 0 && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {tcGecerli ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  )}
                </span>
              )}
            </div>
            {tcHatasi && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <XCircle className="h-3 w-3 shrink-0" />
                {tcHatasi}
              </p>
            )}
            {tcGecerli && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                TC Kimlik No geçerli
              </p>
            )}
          </div>

          {/* İşe Giriş + Maaş */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hizli-ise-baslama">İşe Giriş *</Label>
              <Input
                id="hizli-ise-baslama"
                name="ise_baslama_tarihi"
                type="date"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hizli-maas">Maaş Net (₺) *</Label>
              <Input
                id="hizli-maas"
                name="maas_net"
                type="number"
                min="0"
                step="0.01"
                placeholder="25000"
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Banka modu seçici */}
          <div className="space-y-2">
            <Label>Banka Bilgisi</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={bankaModu === "iban" ? "default" : "outline"}
                onClick={() => setBankaModu("iban")}
                className="flex-1"
                id="btn-banka-iban"
              >
                IBAN
              </Button>
              <Button
                type="button"
                size="sm"
                variant={bankaModu === "hesap" ? "default" : "outline"}
                onClick={() => setBankaModu("hesap")}
                className="flex-1"
                id="btn-banka-hesap"
              >
                Şube + Hesap No
              </Button>
            </div>

            {bankaModu === "iban" ? (
              <Input
                id="hizli-iban"
                name="iban"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                disabled={isPending}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="hizli-sube"
                  name="sube_kodu"
                  placeholder="Şube Kodu"
                  disabled={isPending}
                />
                <Input
                  id="hizli-hesap"
                  name="hesap_no"
                  placeholder="Hesap No"
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isPending || (tcDegeri.length > 0 && !tcGecerli)}
              id="btn-hizli-ekle-kaydet"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
