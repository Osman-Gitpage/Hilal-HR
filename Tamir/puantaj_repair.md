# Puantaj Modülü — Tamir Raporu

> **Kural:** Bu rapordaki hiçbir düzeltme mevcut çalışan davranışı bozmadan yapılmalıdır.
> Her madde için "Şu an ne var" ve "Ne olmalı" açıkça belirtilmiştir.

---

## DOSYA 1 — `src/app/actions/puantaj.ts` (1676 satır)

### Hata 1.1 — `getAuthContext` kopyalanmış, import edilmemiş

**Satır:** 17–41

**Şu an ne var:**
```ts
async function getAuthContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");
  const { data: ks, error: ksError } = await supabase
    .from("kullanici_sirket")
    ...
  return { supabase, user, sirketId: (ks as any).sirket_id as string, rol: (ks as any).rol as string };
}
```

**Sorun:** Bu fonksiyon `src/lib/auth/context.ts` dosyasında zaten var. Bu dosyaya elle kopyalanmış. Her actions dosyasında ayrı ayrı yaşıyor. Birinde değişiklik olsa diğerleri eskide kalır.

**Ne olmalı:**
```ts
import { getAuthContext } from "@/lib/auth/context";
```
Dosyanın başına bu import satırı ekle, 17–41. satırlar arasındaki yerel `getAuthContext` fonksiyonunu tamamen sil.

---

### Hata 1.2 — `/* eslint-disable @typescript-eslint/no-explicit-any */` dosya başında

**Satır:** 3

**Şu an ne var:**
Dosyanın tamamında `any` susturulmuş. Bu yüzden `as any` kullanımları 40+ yerde var.

**Sorun:** Tüm tip güvenliği devre dışı. Hatalı tip dönüşümleri sessizce geçiyor.

**En kötü örnekler:**
- Satır 38: `sirketId: (ks as any).sirket_id as string` — `getAuthContext` zaten doğru tip dönerse bu gerekmez
- Satır 100–102: `(personelList ?? []) as any[]` — Supabase zaten doğru tip üretiyor, `any[]` gereksiz
- Satır 127: `(mevcutKayit as any)?.kapali` — `kapali` alanı DB şemasında var, tip bilinebilir
- Satır 163: `.upsert(kayit as any, ...)` — `PuantajGenelInsert` tipi var, cast gereksiz
- Satır 215, 241: `.update({ kapali: true, updated_at: ... } as any)` — `updated_at` şemada `any` gerektirmemeli
- Satır 285, 369: `return (data ?? []) as any[]` — hook tarafında tip tanımlandığında gereksiz
- Satır 456: `fatura_kodlari: (veri.fatura_kodlari ?? []) as any` — `FaturaKodu[]` tipi zaten var
- Satır 468: `const projeId = (data as any).id` — `.select("id").single()` zaten `{ id: string }` döner

**Ne olmalı:**
Her `as any` kullanımını tek tek incele. `getAuthContext` düzeltilince ve Supabase `Tables<>` tipleri kullanılınca büyük çoğunluğu kendiliğinden düzelir. eslint-disable satırını sil.

---

### Hata 1.3 — Hata yönetimi tutarsız: bazen `throw`, bazen `return { hata }`

**Şu an ne var:**
```ts
// Bazı fonksiyonlar throw eder:
if (pErr) throw new Error(pErr.message);        // satır 75

// Bazıları return eder:
if (error) return { hata: error.message };       // satır 165, 197, 220...

// Bazıları hiç hata yönetimi yapmaz (silent fail):
await supabase.from("proje_donem_log").insert({...}); // satır 471 — hata kontrolü yok
```

**Sorun:** Hook tarafında bazen `try/catch` yazmak gerekiyor, bazen `sonuc.hata` kontrol ediliyor. Bu ikisi aynı modülde karışık kullanıldığında hangi action'ın nasıl davrandığı belirsizleşiyor. Özellikle satır 471'deki `proje_donem_log` insert'i sessizce başarısız olabilir.

**Ne olmalı:**
`cod.md` Kural 3'e göre: ya değer döndür ya `throw`. Bu modülde veri döndürme gereken sorgularda `throw`, mutasyon action'larında `return { hata }` yaklaşımı tutarlı biçimde kullanılmalı. Satır 471 (ve benzeri silent insert'ler) için en azından hata loglama ekle:
```ts
const { error: logErr } = await supabase.from("proje_donem_log").insert({...});
if (logErr) console.error("Dönem log oluşturulamadı:", logErr.message);
```

---

### Hata 1.4 — `hesaplaCalismaSaati` mantığı 3 farklı yerde kopyalanmış

**Şu an ne var:**
Satır 139–145 (`gunVeriGir`), Satır 782–788 (`topluGunGirisi`), Satır 941–947 (`projePuantajVeGenelGir`), Satır 1177–1183 (`topluProjePuantajGirisi`) — **aynı hesaplama 4 kez yazılmış:**
```ts
const [gh, gm] = veri.giris_saati.split(":").map(Number);
const [ch, cm] = veri.cikis_saati.split(":").map(Number);
const dakika = (ch * 60 + cm) - (gh * 60 + gm);
calisma_saati = dakika > 0 ? Math.round((dakika / 60) * 100) / 100 : null;
```

Üstelik `GunVeriGirisiModal.tsx` satır 39–46'da `hesaplaCalismaSaati` adıyla 5. kez yazılmış.

**Ne olmalı:**
`src/lib/utils/maasHesap.ts` (zaten var) veya yeni `src/lib/utils/puantaj.ts` dosyasına taşı:
```ts
export function saatFarkiHesapla(giris: string, cikis: string): number | null {
  const [gh, gm] = giris.split(":").map(Number);
  const [ch, cm] = cikis.split(":").map(Number);
  const dakika = ch * 60 + cm - (gh * 60 + gm);
  return dakika > 0 ? Math.round((dakika / 60) * 100) / 100 : null;
}
```
Sonra 5 kullanım yerinde bu fonksiyonu import et.

---

### Hata 1.5 — `mesai_saati` hesaplama mantığı da 4 yerde kopyalanmış

**Şu an ne var:**
Satır 158, 800, 961, 1186–1191 — aynı `PM` özel durum kontrolü 4 kez:
```ts
mesai_saati: veri.ozel_durum === "PM"
  ? (veri.mesai_saati ?? null)
  : (veri.ozel_durum ? null : (veri.mesai_saati ?? null))
```

**Ne olmalı:**
Aynı utils dosyasına taşı:
```ts
export function mesaiSaatiHesapla(
  ozelDurum: string | null | undefined,
  mesaiSaati: number | null | undefined
): number | null {
  if (ozelDurum === "PM") return mesaiSaati ?? null;
  if (ozelDurum) return null;
  return mesaiSaati ?? null;
}
```

---

### Hata 1.6 — `ayBaslangic` / `ayBitis` string hesabı 7 farklı yerde kopyalanmış

**Şu an ne var:**
Satır 54–55, 210–211, 236–237, 267–268, 384–385, 1270–1271 — her fonksiyonda aynı 2 satır:
```ts
const ayBaslangic = `${yil}-${String(ay).padStart(2, "0")}-01`;
const ayBitis = `${yil}-${String(ay).padStart(2, "0")}-${new Date(yil, ay, 0).getDate()}`;
```

**Ne olmalı:**
```ts
// lib/utils/puantaj.ts içine ekle
export function ayAralik(yil: number, ay: number) {
  const pad = String(ay).padStart(2, "0");
  return {
    ayBaslangic: `${yil}-${pad}-01`,
    ayBitis: `${yil}-${pad}-${new Date(yil, ay, 0).getDate()}`,
  };
}
```

---

### Hata 1.7 — `gunVeriGir` → Kapalı ay kontrolü `sirket_id` filtresiz

**Satır:** 120–125

**Şu an ne var:**
```ts
const { data: mevcutKayit } = await supabase
  .from("puantaj_genel")
  .select("kapali")
  .eq("personel_id", personelId)
  .eq("tarih", tarih)
  .maybeSingle();
```

**Sorun:** `.eq("sirket_id", sirketId)` eksik! Farklı şirkete ait aynı `personelId` + `tarih` kombinasyonu varsa yanlış `kapali` değeri döner. Bu bir güvenlik açığı.

**Ne olmalı:**
```ts
.eq("personel_id", personelId)
.eq("tarih", tarih)
.eq("sirket_id", sirketId)   // ← bu satır eklenmeli
.maybeSingle();
```

---

### Hata 1.8 — `projeSaatGir` → saat kontrolü `saat <= 0` mantıksal hata

**Satır:** 302

**Şu an ne var:**
```ts
if (saat <= 0 || saat > 256) {
  return { hata: "Saat değeri 0 ile 256 arasında olmalıdır." };
}
```

**Sorun:** Hata mesajı "0 ile 256 arasında" diyor ama `saat === 0` de reddediliyor (`<= 0` ile). Mesaj ya `0 < saat <= 256` şeklinde düzeltilmeli ya da `saat < 0` ile kontrol yapılmalı (0 saat girilebilsin istenirse).

**Ne olmalı:**
```ts
if (saat < 0 || saat > 256) {
  return { hata: "Saat değeri 0 ile 256 arasında olmalıdır." };
}
```

---

### Hata 1.9 — `AY_ISIMLERI` sabiti actions dosyasında tanımlı (1410. satır)

**Satır:** 1410–1424

**Şu an ne var:**
```ts
const AY_ISIMLERI = ["", "Ocak", "Şubat", ...];
```

Bu sabit `lib/constants/index.ts`'te bulunmuyor. Üstelik `GenelPuantajView.tsx`'te `AY_ADLARI`, `GunVeriGirisiModal.tsx`'te tekrar `AY_ADLARI`, `ProjePuantajView.tsx`'te yine `AY_ADLARI` adıyla toplamda **5 farklı yerde** tanımlanmış.

**Ne olmalı:**
`lib/constants/index.ts`'e ekle:
```ts
export const AY_ADLARI = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] as const;
```
Tüm kullanım yerlerinde import et, yerel tanımı sil.

---

### Hata 1.10 — `topluProjePuantajGirisi` → Döngü içinde N+1 Supabase sorgusu

**Satır:** 1175–1248

**Şu an ne var:**
Her kayıt için ayrı `delete` + `insert` + `select` yapılıyor:
```ts
for (const k of aktifKayitlar) {
  await supabase.from("puantaj_proje").delete()...    // her item için ayrı sorgu
  await supabase.from("puantaj_proje").insert(...)    // her item için ayrı sorgu
  const { data } = await supabase.from("puantaj_proje").select(...)  // her item için ayrı sorgu
  await supabase.from("puantaj_genel").upsert(...)    // her item için ayrı sorgu
}
```

**Sorun:** 20 personel × 10 gün = 200 kayıt varsa → 800 ayrı DB çağrısı. Bu hem yavaş hem rate limit'e çarpabilir.

**Ne olmalı:**
Toplu işlemler için `delete` ve `insert`'leri mümkün olduğunca batch'e al:
- İlk olarak tüm `(sirket_id, personel_id, proje_id, tarih)` kombinasyonlarını tek DELETE sorgusuyla sil (`.in("tarih", tarihler)` kullanarak)
- Sonra tüm `projeKayit`ları tek `supabase.from("puantaj_proje").insert(kayitlar[])` çağrısıyla ekle
- `puantaj_genel` güncellemesini de batch upsert olarak yap

---

### Hata 1.11 — `personelPuantajGetir` → proje mesaisi çifte sayılıyor

**Satır:** 1537–1545 ve 1609–1617

**Şu an ne var:**
```ts
// Aylık özet döngüsü:
for (const p of mProje) {
  if (p.saat && p.saat > 0) {
    mesaiSaati += p.saat;       // proje saati mesaiye ekleniyor
  }
  if (p.mesai_saati) {
    mesaiSaati += p.mesai_saati; // mesai_saati de ayrıca ekleniyor
  }
}
```

**Sorun:** Proje `saat` alanı (çalışma saati) mesai havuzuna ekleniyor. Bu yanlış — proje çalışma saati çalışma saatidir, mesai değil. Ayrıca `mesai_saati` de ayrıca toplanıyor. Eğer bir kayıtta `saat=8` ve `mesai_saati=2` varsa, mesaiye `8 + 2 = 10` ekleniyor; oysa sadece `2` eklenmeli.

**Ne olmalı:**
```ts
for (const p of mProje) {
  // Sadece mesai_saati'ni mesai havuzuna ekle
  if (p.mesai_saati && p.mesai_saati > 0) {
    mesaiSaati += p.mesai_saati;
  }
  // Proje çalışma saati zaten puantaj_genel.calisma_saati'ne yansıyor,
  // burada ayrıca sayma
}
```

---

## DOSYA 2 — `src/components/modules/puantaj/GenelPuantajView.tsx` (1052 satır)

### Hata 2.1 — `AY_ADLARI` ve `GUN_KISALTMALARI` bileşen içinde tanımlı

**Satır:** 57–62

**Şu an ne var:**
```ts
const AY_ADLARI = ["", "Ocak", "Şubat", ...];
const GUN_KISALTMALARI = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
```

Bu dosyada tanımlı. Aynı sabitler `GunVeriGirisiModal.tsx`, `ProjePuantajView.tsx`, `actions/puantaj.ts` içinde de ayrıca tanımlı.

**Ne olmalı:** `lib/constants/index.ts`'ten import et (Hata 1.9 ile birlikte çözülür).

---

### Hata 2.2 — `RENK_SINIFI` hem burada hem `GunVeriGirisiModal.tsx`'te tanımlı (farklı yapıda!)

**Satır:** 65–73 (`GenelPuantajView.tsx`) ve `GunVeriGirisiModal.tsx` satır 93–100

**Şu an ne var:**
`GenelPuantajView.tsx`'te:
```ts
const RENK_SINIFI: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 ...",
  ...
};
```
`GunVeriGirisiModal.tsx`'te:
```ts
const RENK_SINIFI: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: "bg-blue-50 ...", border: "border-blue-400", text: "text-blue-700 ..." },
  ...
};
```

**Sorun:** Farklı yapıda, farklı renk tonları. Biri tek string, diğeri 3 parçalı obje. UI tutarsızlığı — aynı özel durum farklı bileşende farklı renkle gösterilir.

**Ne olmalı:**
`lib/constants/index.ts`'te tek bir `OZEL_DURUM_RENK` sabiti tanımla, her iki kullanım yeri için yeterli bilgiyi içersin. İki bileşenin birbirinden farklı format kullanması kabul edilebilir ama renk değerleri aynı olmalı.

---

### Hata 2.3 — `hesaplaToplam` fonksiyonu bileşen içinde, her render'da yeniden oluşturuluyor

**Satır:** 395–423

**Şu an ne var:**
```ts
function hesaplaToplam(personelId: string) {
  const kayitlar = puantajMap.get(personelId);
  // hesaplama mantığı...
  return { calisma, mesai, sgkGun };
}
```

Bu fonksiyon `render` içinde tanımlı ve her personel satırı render edildiğinde çağrılıyor.

**Sorun:** `useMemo` ile wrap'lenmemiş. 50 personel varsa ve her birinde 30 gün verisi varsa, her render'da 50 × 30 iterasyon yapılıyor.

**Ne olmalı:**
```ts
const toplamMap = useMemo(() => {
  const map = new Map<string, { calisma: number; mesai: number; sgkGun: number }>();
  for (const p of personeller) {
    // hesaplama...
    map.set(p.id, { calisma, mesai, sgkGun });
  }
  return map;
}, [puantajMap, personeller]);
```

---

### Hata 2.4 — `handleHucreTikla` içinde `data?.puantajlar?.find(...)` çağrısı `puantajMap`'e rağmen tekrar arama yapıyor

**Satır:** 444–446

**Şu an ne var:**
```ts
const mevcutVeri = data?.puantajlar?.find(
  (p: Record<string, unknown>) => p.personel_id === personelId && p.tarih === tarih
) as HucreDurumu | undefined;
```

**Sorun:** `puantajMap` tam bu amaçla `useMemo` ile oluşturulmuş iken, burada yine array üzerinde `.find()` yapılıyor. `puantajMap.get(personelId)?.get(tarih)` kullanılmalı.

**Ne olmalı:**
```ts
const mevcutVeri = puantajMap.get(personelId)?.get(tarih);
```

---

### Hata 2.5 — Toplu Excel ve PDF işlemleri bileşen içinde `topluPuantajVerisiGetir` çağırıyor

**Satır:** 634–651

**Şu an ne var:**
```tsx
onExport={async () => {
  const veri = await topluPuantajVerisiGetir(yil, ay);  // ← server action direkt bileşenden
  topluPuantajExport(veri);
}}
```

**Sorun:** Server action `topluPuantajVerisiGetir` doğrudan bileşenden çağrılıyor ama bu veri TanStack Query cache'ine girmiyor. Aynı veri tekrar tekrar sunucudan çekiliyor.

**Ne olmalı:**
`useTopluPuantajVerisi(yil, ay)` adında bir `useQuery` hook'u oluştur. Ya da en azından `useCallback` + `useQueryClient.fetchQuery` ile cache'i kullan.

---

### Hata 2.6 — `GunVeriGirisiModal` toplu mod için boş string prop'larla çağrılıyor

**Satır:** 963–978

**Şu an ne var:**
```tsx
<GunVeriGirisiModal
  key="toplu-hucre-girisi"
  acik={topluModalAcik}
  personelId=""     // ← boş string
  personelAd=""     // ← boş string
  tarih=""          // ← boş string
  ...
/>
```

**Sorun:** `personelId`, `personelAd`, `tarih` props'ları `string` tipinde tanımlanmış ama toplu modda anlamsız değerler gönderiliyor. Tip sistemi bunu yakalayamıyor çünkü `string` geçerli. Modal içinde bu değerlerin boş olup olmadığı kontrol edilmeli.

**Ne olmalı:**
Modal'a `mod: "tekil" | "toplu"` prop'u ekle. Toplu modda `personelId`, `personelAd`, `tarih` zorunlu olmasın (`string | null` veya `optional`). Ya da toplu için ayrı `TopluVeriGirisiModal` bileşeni oluştur.

---

### Hata 2.7 — Tooltip yazısında yazım hatası

**Satır:** 772 ve 775

**Şu an ne var:**
```tsx
title="Tıklayarak düzzenleyebilirsiniz"
```

**Sorun:** "düzzenleyebilirsiniz" → "düzenleyebilirsiniz" (çift z)

**Ne olmalı:**
```tsx
title="Tıklayarak düzenleyebilirsiniz"
```

---

### Hata 2.8 — `IIFE` (`(() => {...})()`) tablo satırında

**Satır:** 852–906

**Şu an ne var:**
```tsx
{(() => {
  const { calisma, mesai, sgkGun } = hesaplaToplam(p.id);
  ...
  return (<>...</>);
})()}
```

**Sorun:** JSX içinde IIFE kullanmak React anti-pattern'i. Her render'da yeni fonksiyon yaratılır, debug'ı zorlaştırır, okunabilirliği düşürür.

**Ne olmalı:**
Bunu `<PersonelOzetSutunlar personelId={p.id} ... />` adında ayrı bir bileşene çıkar veya üst `useMemo` ile önceden hesapla (Hata 2.3 ile birlikte çözülür).

---

## DOSYA 3 — `src/components/modules/puantaj/ProjelerView.tsx` (1102 satır)

### Hata 3.1 — `formatTarih` fonksiyonu burada yerel olarak tanımlı

**Satır:** 27–31

**Şu an ne var:**
```ts
function formatTarih(tarih: string | null | undefined): string {
  if (!tarih) return "—";
  const [yil, ay, gun] = tarih.split("-");
  return `${gun}.${ay}.${yil}`;
}
```

**Sorun:** `src/lib/utils/index.ts`'te `formatTarih` fonksiyonu zaten var. Burada elle yeniden yazılmış.

**Ne olmalı:**
```ts
import { formatTarih } from "@/lib/utils";
```
Yerel tanımı sil.

---

### Hata 3.2 — `AY_ADLARI` burada da yerel tanımlı

`ProjelerView.tsx` içinde `formatTarih` fonksiyonundan türetilmiş bir tarih formatı kullanıldığı için doğrudan `AY_ADLARI` yok ama `ProjePuantajView.tsx` satır 59'da tekrar tanımlanmış. Hata 2.1 ile birlikte çözülür.

---

### Hata 3.3 — `ProjeFormDialog` içinde `handleAc` fonksiyonu `eslint-disable-next-line` ile bastırılmış

**Satır:** 191–194

**Şu an ne var:**
```ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleAc = useCallback(() => {
  setForm(duzenlenecekProje ? formFromProje(duzenlenecekProje) : bosForm());
}, [duzenlenecekProje]);
```

**Sorun:** `handleAc` hiç kullanılmıyor. Dialog `onOpenChange` üzerinden `useEffect` zaten formu resetliyor. Bu kod ölü kod.

**Ne olmalı:**
`handleAc` fonksiyonunu ve eslint-disable satırını tamamen sil.

---

### Hata 3.4 — `ProjeFormDialog` form state'i Zod ile valide edilmiyor, manuel kontrol yapılıyor

**Satır:** 200–216

**Şu an ne var:**
```ts
function handleKaydet() {
  if (!form.ad.trim()) { toast.error("Proje adı zorunludur."); return; }
  if (!form.baslangic_tarihi) { toast.error("Başlangıç tarihi zorunludur."); return; }
  for (const k of form.fatura_kodlari) {
    if (!k.kod.trim() || !k.tarih) { toast.error("Fatura kodu ve tarihi boş bırakılamaz."); return; }
  }
  ...
}
```

**Sorun:** `src/lib/validations/puantaj.ts` içinde zaten Zod şemaları var. Form validasyonu da Zod ile yapılmalı — tek kaynak, tekrar yazma yok.

**Ne olmalı:**
```ts
import { ProjeEkleSchema } from "@/lib/validations/puantaj";

function handleKaydet() {
  const result = ProjeEkleSchema.safeParse(form);
  if (!result.success) {
    toast.error(result.error.issues[0].message);
    return;
  }
  ...
}
```

---

### Hata 3.5 — `ArsivDialog` içinde `[isPending, startTransition]` kullanımı gereksiz konfigürasyon

**Satır:** 400+ civarı

`useTransition` kullanılıyor ama mutation zaten `isPending` state'i taşıyor. İki ayrı loading state yönetimi var — biri mutation'ın kendi `isPending`'i, biri `useTransition`'ın.

**Ne olmalı:**
`useTransition` kaldırılabilir. `mutation.isPending` kullanmak yeterli.

---

## DOSYA 4 — `src/components/modules/puantaj/GunVeriGirisiModal.tsx` (712 satır)

### Hata 4.1 — `AY_ADLARI` ve `GUN_ADLARI` bu dosyada da yerel tanımlı

**Satır:** 24–28

Bu sabitler modül genelinde 5. kez burada tanımlanmış. Hata 1.9 ile birlikte çözülür.

---

### Hata 4.2 — `hesaplaCalismaSaati` ve `hesaplaMesaiSaatiFn` burada da yerel

**Satır:** 39–55

**Şu an ne var:**
```ts
function hesaplaCalismaSaati(giris: string, cikis: string): number | null { ... }
function hesaplaMesaiSaatiFn(baslangic: string, bitis: string): number | null { ... }
```

Bu fonksiyonlar `actions/puantaj.ts`'te de inline yazılmış (Hata 1.4). Hata 1.4 ile birlikte merkezi utils'e taşındığında buradan da import edilmeli.

---

### Hata 4.3 — Modal hem tekil hem toplu mod için kullanılıyor, prop arayüzü karmaşık

**Satır:** 60–86

**Şu an ne var:**
```ts
interface GunVeriGirisiModalProps {
  personelId: string;
  personelAd: string;
  tarih: string;
  onKaydetOverride?: (...) => ...;   // proje sayfası için
  onSilOverride?: (...) => ...;      // proje sayfası için
  topluHucreSayisi?: number;         // toplu mod için
  onTopluKaydet?: (...) => ...;      // toplu mod için
}
```

**Sorun:** 4 farklı kullanım senaryosu tek bir bileşende toplanmış:
1. Genel puantaj — tekil giriş
2. Proje puantaj — tekil giriş (`onKaydetOverride`)
3. Genel puantaj — toplu seçim (`topluHucreSayisi`, `onTopluKaydet`)
4. Proje puantaj — toplu giriş (her ikisi)

Bu karmaşıklık `if/else` zincirleriyle modal içinde yönetiliyor. Kod dallanması artıyor, test edilebilirlik azalıyor.

**Ne olmalı:**
Bu derhal değiştirilemez (bozar), ama yeni geliştirmeler için `GenelVeriGirisiModal` ve `ProjeVeriGirisiModal` olarak ikiye bölünebilir. Şimdilik mevcut props'ların JSDoc açıklamalarını güncelle.

---

### Hata 4.4 — `tarihFormatla` fonksiyonu burada yerel

**Satır:** 30–34

```ts
function tarihFormatla(tarih: string): string {
  const [yil, ay, gun] = tarih.split("-").map(Number);
  const d = new Date(yil, ay - 1, gun);
  return `${GUN_ADLARI[d.getDay()]}, ${gun} ${AY_ADLARI[ay]} ${yil}`;
}
```

`lib/utils/index.ts`'teki `formatTarih` farklı format veriyor (`15.01.2024`). Bu fonksiyon farklı format istiyor (`Çarşamba, 15 Ocak 2024`). Bu kabul edilebilir, ama `date-fns` zaten bu formatı sağlıyor:
```ts
import { format } from "date-fns";
import { tr } from "date-fns/locale";
format(parseISO(tarih), "EEEE, d MMMM yyyy", { locale: tr });
```

**Ne olmalı:** Yerel fonksiyonu `date-fns` ile değiştir, `AY_ADLARI` ve `GUN_ADLARI` sabitlerini kaldır.

---

## DOSYA 5 — `src/components/modules/puantaj/TopluGunGirisiPanel.tsx` (671 satır)

### Hata 5.1 — Panel bileşeni çok büyük, dahili mantık dışa çıkarılmamış

Panel içinde personel seçimi, gün seçimi, veri girişi formu, önizleme ve gönderme mantığının tamamı tek bileşende. Bu bileşen kendi başına 671 satır.

Bu şimdilik işlevsel, kırılması riskli. Belgeleme amaçlı not: ileride `PersonelSecimi`, `GunSecimi`, `TopluVeriFormu` alt bileşenlerine ayrılabilir.

---

## DOSYA 6 — `src/components/modules/puantaj/ProjePuantajView.tsx` (765 satır)

### Hata 6.1 — `AY_ADLARI` ve `GUN_KISALTMALARI` yine yerel tanımlı

**Satır:** 59–62

Hata 1.9, 2.1 ile aynı sorun. Hata 1.9 çözüldüğünde buradan da import edilmeli.

---

### Hata 6.2 — `RENK_SINIFI` yine burada tanımlı

Hata 2.2 ile aynı sorun.

---

### Hata 6.3 — `PuantajHucre` bileşeni hem burada hem `GenelPuantajView.tsx`'te ayrı tanımlı

`GenelPuantajView.tsx`'te `PuantajHucre` bileşeni var. `ProjePuantajView.tsx`'te benzer ama biraz farklı bir hücre bileşeni var. İkisi farklı davranışlar sergiliyor ama aynı görsel çıktıyı üretiyor — bu UI tutarsızlığı.

**Ne olmalı:** Ortak bir `PuantajHucre` bileşeni oluştur, iki view da bunu kullansın. Farklılıklar props ile kontrol edilsin.

---

## DOSYA 7 — `src/hooks/usePuantaj.ts` (645 satır)

### Hata 7.1 — Tek import satırında 25+ fonksiyon

**Satır:** 6

**Şu an ne var:**
```ts
import { ayPuantajGetir, gunVeriGir, gunVeriSil, ayKapat, ayAc, projePuantajGetir,
  projeSaatGir, projeSaatSil, projeleriGetir, donemAktifProjeleriGetir, projeEkle,
  projeGuncelle, projeArsivle, projeAktivasyonu, projeSil, projePuantajVeGenelGir,
  projePuantajVeGenelSil, ayOzetGetir, ayOzetKaydet, projeDonemLogListele,
  projeDonemLogEkle, projeDonemLogGuncelle, projeDonemLogSil, projeDetayGetir,
  topluGunGirisi, topluProjePuantajGirisi, topluPuantajVerisiGetir, personelPuantajGetir,
  type PersonelPuantajSonucu } from "@/app/actions/puantaj";
```

**Sorun:** 25+ fonksiyon tek dosyadan import ediliyor. `actions/puantaj.ts` ile bu dosya arasında sıkı bağımlılık var.

**Ne olmalı (kısa vadede):** Mevcut yapı korunarak en azından satır uzunluğunu azalt, her 5–6 fonksiyonu ayrı satıra yaz. **Uzun vadede** actions 3 dosyaya bölündüğünde bu da doğal olarak çözülür.

---

### Hata 7.2 — `useGunVeriGir` ve `useGunVeriSil` aynı `refetchQueries` mantığı

**Satır:** 65–99

**Şu an ne var:**
```ts
export function useGunVeriGir(yil: number, ay: number) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore(s => s.aktifSirketId);
  return useMutation({
    mutationFn: (...) => gunVeriGir(...),
    onSuccess: async () => {
      if (!sirketId) return;
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay) });
    },
  });
}

export function useGunVeriSil(yil: number, ay: number) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore(s => s.aktifSirketId);
  return useMutation({
    mutationFn: (...) => gunVeriSil(...),
    onSuccess: async () => {
      if (!sirketId) return;
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay) });
    },
  });
}
```

`onSuccess` mantığı ikisinde **birebir aynı**.

**Ne olmalı:**
```ts
function usePuantajGenelRefetch(yil: number, ay: number) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore(s => s.aktifSirketId);
  return async () => {
    if (!sirketId) return;
    await queryClient.refetchQueries({ queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay) });
  };
}
```
Her iki hook bunu kullanır.

---

### Hata 7.3 — `refetchQueries` yerine `invalidateQueries` kullanılmalı

**Şu an ne var:** Birden fazla hook'ta `refetchQueries` kullanılıyor.

**Sorun:** `refetchQueries`, sorgu aktif olsun ya da olmasın hemen veri çeker. `invalidateQueries`, sorgu aktifse yeniler, değilse stale işaretler ve bir sonraki mount'ta çeker. Kaynakları gereksiz tüketiyor.

**Ne olmalı:** `refetchQueries` → `invalidateQueries` olarak değiştir (tüm hook'larda).

---

## DOSYA 8 — `src/lib/validations/puantaj.ts` (84 satır)

### Hata 8.1 — `ProjeEkleSchema` yok

`projeEkle` action'ı kendi içinde manuel validasyon yapıyor (Hata 3.4). Ama `puantaj.ts` validasyonlar dosyasında proje için Zod şeması tanımlı değil.

**Ne olmalı:**
```ts
export const ProjeEkleSchema = z.object({
  ad: z.string().min(1, "Proje adı zorunludur.").max(120),
  baslangic_tarihi: z.string().min(1, "Başlangıç tarihi zorunludur."),
  firma_adi: z.string().max(120).nullable().optional(),
  adres_1: z.string().max(200).nullable().optional(),
  adres_2: z.string().max(200).nullable().optional(),
  bolge: z.string().max(100).nullable().optional(),
  tersane_adi: z.string().max(100).nullable().optional(),
  aciklama: z.string().max(400).nullable().optional(),
  fatura_kodlari: z.array(z.object({
    tip: z.enum(["Fatura", "Proforma"]),
    kod: z.string().min(1, "Fatura kodu boş olamaz."),
    tarih: z.string().min(1, "Fatura tarihi zorunludur."),
  })).optional().default([]),
});

export type ProjeEkleInput = z.infer<typeof ProjeEkleSchema>;
```

---

## DOSYA 9 — `src/lib/pdf/puantajPdf.ts` ve `src/lib/excel/puantajExport.ts`

### Genel Not

Bu dosyalarda işlevsel bir hata tespit edilmedi. Ancak her ikisi de `any[]` tipiyle çalışıyor — parametre tiplerinin `lib/validations/puantaj.ts` veya `supabase/app-types` üzerinden sıkılaştırılması önerilir.

---

## DOSYA 10 — `src/components/modules/personel/PersonelPuantajTab.tsx` (959 satır)

### Hata 10.1 — `formatTarih` yerel tanımlı

Bu bileşende de `tarih` formatlama lokalde yapılıyor. `lib/utils`'ten import edilmeli.

### Hata 10.2 — `AY_ADLARI` yerel tanımlı

Hata 1.9 ile aynı sorun — bu dosyada 6. tanım.

### Hata 10.3 — `personelPuantajGetir` hook'u `useQuery` ile sarılmamış, action direkt çağrılıyor mu?

İncelenmeli. Eğer `useEffect` içinde direkt action çağrısı varsa, `useQuery`'e taşınmalı.

---

## DOSYA 11 — `src/components/modules/puantaj/ProjeAyPuantajTablosu.tsx` (607 satır)

> Bu dosya önceki analizde eksik kalmıştı.

### Hata 11.1 — `AY_ADLARI` ve `GUN_KISALTMALARI` burada da yerel tanımlı

**Satır:** 42–46 — Bu modülde **7. ve 8. tanım**. Hata 1.9 çözüldüğünde import ekle.

---

### Hata 11.2 — `ProjePuantajHucre` bileşenini `ProjePuantajView` sayfa bileşeninden import ediyor

**Satır:** 34

```ts
import { ProjePuantajHucre, type HucreDurumu } from "./ProjePuantajView";
```

Tablo bileşeni, sayfa görünümünden bileşen alıyor — ters bağımlılık. `ProjePuantajHucre` ve `HucreDurumu` ayrı bir `PuantajHucre.tsx` dosyasına çıkarılmalı.

---

### Hata 11.3 — `handleHucreSecimToggle` + ESC `useEffect` mantığı `ProjePuantajView` ile birebir kopyalanmış

**Satır:** 116–140 → `ProjePuantajView` satır 281–309 ile **birebir aynı**.

ESC tuşu handler ve toplu seçim toggle mantığı her iki dosyada da tekrar edilmiş.

**Ne olmalı:** `hooks/useHucreSecimModu.ts` adında bir custom hook — bu mantık tek yerden yönetilsin.

---

### Hata 11.4 — `hesaplaToplam` / `hesaplaToplamMesai` useMemo yok, her render'da iterate ediyor

Hata 2.3 ile aynı sorun. `useMemo` ile sarılmalı.

---

### Hata 11.5 — Toplu modal için boş string prop'larla `GunVeriGirisiModal` çağırılıyor

Hata 2.6 ile aynı sorun. `ProjeAyPuantajTablosu` içinde de `personelId=""`, `personelAd=""`, `tarih=""` gönderiliyor.

---

## ⚠️ MODAL — SABİT KOD DESENKRONİZASYONU

> Tam olarak sorduğun sorun: **Modal bir özellik aldı, ama aynı kodu kullanan diğer bileşenler güncellenmedi.**

---

### DS-1 — `RENK_SINIFI` modal'da zenginleştirildi, tablolarda eski format kaldı

| Dosya | Format | Mavi renk tonu |
|---|---|---|
| `GunVeriGirisiModal.tsx` | `{bg, border, text}` ayrı | `bg-blue-50`, `blue-950/40` |
| `GenelPuantajView.tsx` | Tek string | `bg-blue-100`, `blue-900/40` |
| `ProjePuantajView.tsx` | Tek string | `bg-blue-100`, `blue-900/40` |

**Sorun:** Modal daha zengin bir stil sistemi aldı (`border` ayrıldı, renk tonları değişti) ama tablolar hâlâ eski formatta. Aynı `YI` (Yıllık İzin) kodu modalda farklı, tabloda farklı renk gösteriyor. Birini değiştirince diğerleri eskide kalıyor.

**Ne olmalı:** `lib/constants/index.ts`'e tek `OZEL_DURUM_STILLER` sabiti:
```ts
export const OZEL_DURUM_STILLER: Record<string, {
  tablo: string;        // tek string — GenelPuantajView, ProjePuantajView
  modal_bg: string;     // GunVeriGirisiModal
  modal_border: string;
  modal_text: string;
}> = { ... };
```

---

### DS-2 — `PuantajHucre` mesai gösteriyor, `ProjePuantajHucre` farklı mesai mantığıyla gösteriyor

**GenelPuantajView `PuantajHucre`:** Mesai göstergesi doğrudan `durum.mesai_saati` veya `oz.mesai` fallback.

**ProjePuantajView `ProjePuantajHucre` satır 185–192:** IIFE içinde farklı fallback mantığı (`oz?.mesai && oz.mesai > 0`).

**Sorun:** `ProjePuantajHucre` daha sonra mesai özelliği aldı ama genel hücre bileşeninin mantığı aynen kopyalanmadı — ince fark var. Ayrıca `GenelPuantajView` amber rengi `text-amber-600`, `ProjePuantajView` ise `text-amber-500` kullanıyor.

---

### DS-3 — `DonemSecici` bileşeni iki dosyada ayrı — biri "Kilitli" badge gösteriyor, diğeri göstermiyor

**GenelPuantajView `DonemSecici` satır 78:**
```tsx
function DonemSecici({ ayKapali }: { ayKapali: boolean }) { ... }
// → "Kilitli" Badge gösteriyor
```

**ProjePuantajView `DonemSecici` satır 79:**
```tsx
function DonemSecici() { ... }
// → ayKapali prop yok, kilitli badge yok
```

**Sorun:** "Kilitli" göstergesi `GenelPuantajView`'a eklenmiş. Proje puantaj sayfasında ay kilitli olsa kullanıcı bunu dönem seçicide göremez. Özellik yarım kalmış.

**Ne olmalı:** Paylaşılan `DonemSecici` bileşeni (`components/modules/puantaj/DonemSecici.tsx`) — bir kez güncelle, her yere yansısın.

---

### DS-4 — `baslangicModu` mantığı modalda var, `TopluGunGirisiPanel`'de yok

**GunVeriGirisiModal.tsx satır 192–203:**
Mevcut veriyi okuyarak `tam_yarim` / `giris_cikis` / `ozel_durum` modunu otomatik belirliyor.

**TopluGunGirisiPanel.tsx:**
Her zaman `giris_cikis` modundan başlıyor. Eğer seçili hücrelerde `tam_yarim` girilmiş kayıtlar varsa, panel bunu okuyup gösteremiyor — kullanıcı aynı değeri tekrar seçmek zorunda.

**Sorun:** Modal geliştirme aldı, panel almadı.

---

### DS-5 — `GUN_KISALTMALARI` ile `GUN_ADLARI` bağımsız kopyalar, değişince birbirini bilmiyor

| Dosya | Tanım |
|---|---|
| `GenelPuantajView.tsx` | `["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"]` |
| `ProjePuantajView.tsx` | `["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"]` |
| `ProjeAyPuantajTablosu.tsx` | `["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"]` |
| `GunVeriGirisiModal.tsx` | `["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"]` |

4 ayrı kopya. "Çar" yerine "Çrş" kullanılmak istenirse 3 dosya güncellenmeli. Biri unutulur.

**Ne olmalı:** `lib/constants/index.ts`'e ekle, tümü oradan import etsin.

---

## ÖNCELİK SIRASI (GÜNCELLENMİŞ)

### 🔴 Önce Bunları Düzelt (güvenlik / doğruluk / görünür hata)

1. **Hata 1.7** — `gunVeriGir`'de `sirket_id` filtresi eksik → güvenlik açığı
2. **Hata 1.11** — Mesai çifte sayılıyor → yanlış bordro verisi
3. **DS-3** — Proje puantajda ay kilitli iken "Kilitli" badge yok → kullanıcı bilgilendirilmiyor
4. **Hata 2.7** — Tooltip yazım hatası

### 🟡 Sonra Bunları Düzelt (kopyalama / desenkronizasyon)

5. **Hata 1.9 + DS-5** — `AY_ADLARI`, `GUN_KISALTMALARI`, `GUN_ADLARI` constants'a → 8 yerel kopya temizlenir
6. **DS-1** — `RENK_SINIFI` tek sabit → modal-tablo renk tutarsızlığı biter
7. **Hata 1.1** — `getAuthContext` import et
8. **Hata 1.4 + 1.5 + 1.6** — Saat hesaplama fonksiyonları utils'e taşı (5 kopya temizlenir)
9. **Hata 3.1 + diğer `formatTarih` kopyaları** — merkezi utils kullan
10. **Hata 11.2** — `ProjePuantajHucre` ayrı dosyaya çıkar (ters bağımlılık)
11. **Hata 11.3** — `useHucreSecimModu` hook'u (2 kopya temizlenir)
12. **Hata 7.3** — `refetchQueries` → `invalidateQueries`

### 🟢 Sonraki Adımlarda (iyileştirme)

13. **Hata 1.2** — `any` temizliği
14. **Hata 1.3** — Hata yönetimi standartlaştır
15. **Hata 1.10** — N+1 sorgu → batch
16. **Hata 2.3 + 11.4** — `hesaplaToplam` useMemo
17. **Hata 2.8** — IIFE kaldır
18. **DS-2** — `PuantajHucre` mesai rengi tutarsızlığı
19. **DS-4** — `TopluGunGirisiPanel` başlangıç modu
20. **Hata 8.1** — `ProjeEkleSchema` ekle

---

*Rapor tarihi: 2026-10-17*
*Toplam tespit edilen sorun: 33 (28 kod hatası + 5 desenkronizasyon)*
