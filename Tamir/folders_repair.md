# Klasör Yapısı — Tamir Raporu

> **Kural:** Taşıma işlemleri önce import yolları güncellenerek yapılmalı, sonra dosya taşınmalı.
> Kodun bozulmaması için her taşıma adımı ayrı commit olmalı.

---

## MEVCUT DURUM — Sorunlu Harita

```
src/
├── app/
│   ├── actions/          ✅ Doğru yer — ama garaj actions burada YOK
│   └── (dashboard)/
│       └── garaj/        ⚠️ garaj route var ama actions/garaj.ts yok
│
├── components/
│   ├── dashboard/        ⚠️ Sadece 1 dosya — neden ayrı klasör?
│   ├── garaj/            ❌ YANLIŞ YER — store, types, data burada
│   ├── landing/          ✅ Kabul edilebilir
│   ├── layout/           ✅ Doğru
│   ├── modules/          ✅ Genel yapı doğru — ama garaj buraya taşınmalı
│   └── ui/               ⚠️ shadcn primitifleri + özel bileşenler karışık
│
├── hooks/                ⚠️ use-mobile.ts burada (adlandırma tutarsız)
│
├── lib/
│   ├── cari.ts           ❌ Kök dizinde yalnız dosya — alt klasöre girmeli
│   ├── utils.ts          ❌ Kök dizinde yalnız dosya — utils/index.ts var zaten
│   ├── docx-sample-generator.ts  ❌ Kök dizinde — templates/ altına girmeli
│   ├── providers.tsx     ⚠️ Kök dizinde — kabul edilebilir ama tartışmalı
│   ├── auth/             ✅
│   ├── constants/        ✅
│   ├── excel/            ✅
│   ├── pdf/              ✅
│   ├── storage/          ✅
│   ├── templates/        ✅
│   ├── utils/            ✅
│   └── validations/      ✅
│
├── stores/
│   └── index.ts          ⚠️ Sadece re-export — gereksiz dosya
│
├── supabase/             ✅ Genel yapı doğru
│
└── types/                ⚠️ Supabase tipleriyle ayrımı belirsiz
    ├── index.ts          ✅
    ├── bordro-form.ts    ✅
    ├── cari.ts           ✅
    └── evrak.ts          ✅
```

---

## SORUN 1 — `components/garaj/` her şeyi içeriyor (BÜYÜK)

### Şu an ne var:
```
src/components/garaj/
  AracFormModal.tsx       ← bileşen (doğru)
  AracOnboardingModal.tsx ← bileşen (doğru)
  AracSilModal.tsx        ← bileşen (doğru)
  CezaEkleModal.tsx       ← bileşen (doğru)
  GarajCard.tsx           ← bileşen (doğru)
  GarajDetayEkrani.tsx    ← bileşen (doğru)
  GarajFiloGorunumu.tsx   ← bileşen (doğru)
  MuayeneGuncelleModal.tsx← bileşen (doğru)
  PoliceEkleModal.tsx     ← bileşen (doğru)
  RuhsatModal.tsx         ← bileşen (doğru)
  ServisDetayModal.tsx    ← bileşen (doğru)
  ServisKayitModal.tsx    ← bileşen (doğru)
  ServisRaporPdfModal.tsx ← bileşen (doğru)
  YakitGirisModal.tsx     ← bileşen (doğru)
  YakitRaporPdfModal.tsx  ← bileşen (doğru)
  garajData.ts            ❌ veri/sabit dosyası — bileşen klasöründe olmamalı
  types.ts                ❌ tip tanımları — bileşen klasöründe olmamalı
  useGarajStore.ts        ❌ Zustand store — stores/ altında olmalı
```

### Sorun:
- `useGarajStore.ts` bir Zustand store'u ama `src/stores/` yerine `src/components/garaj/` içinde.
  Diğer tüm store'lar `src/stores/` altında (`uiStore.ts`, `sirketStore.ts`).
- `types.ts` domain tipleri `src/types/` altında olmalı (`garaj.ts` adıyla).
- `garajData.ts` sabit/örnek veri — `src/lib/` altına veya silinmeli (içi boş).
- Garaj bileşenleri `src/components/modules/garaj/` altına taşınmalı (diğer modüllerle tutarlı).
- `src/app/actions/garaj.ts` VAR ama `components/garaj/` içinde bulunan `useGarajStore.ts`
  actions'ı kullanmıyor mu diye kontrol edilmeli.

### Ne olmalı:
```
src/
├── components/modules/garaj/     ← bileşenler buraya
│   ├── AracFormModal.tsx
│   ├── AracOnboardingModal.tsx
│   └── ... (tüm modal ve view bileşenleri)
├── stores/
│   └── garajStore.ts             ← useGarajStore.ts buraya taşınır
├── types/
│   └── garaj.ts                  ← types.ts buraya taşınır
└── lib/
    └── (garajData.ts silinir veya constants/index.ts'e eklenir)
```

---

## SORUN 2 — `components/dashboard/` tek dosya için klasör açılmış

### Şu an ne var:
```
src/components/dashboard/
  OnboardingChecklist.tsx    ← tek dosya
```

### Sorun:
Bir klasörde sadece 1 dosya var. Bu bileşen ya `components/modules/onboarding/` altına ya da `components/layout/` altına girmeli.

### Ne olmalı:
```
src/components/modules/onboarding/
  OnboardingWizard.tsx        ← zaten burada
  OnboardingChecklist.tsx     ← dashboard/'dan taşınır
```
`components/dashboard/` klasörü silinir.

---

## SORUN 3 — `components/ui/` içinde shadcn dışı bileşenler var

### Şu an ne var:
```
src/components/ui/
  button.tsx           ✅ shadcn primitifi
  input.tsx            ✅ shadcn primitifi
  ...
  DocxViewer.tsx           ❌ iş mantığı içeren özel bileşen
  DosyaGoruntule.tsx        ❌ iş mantığı içeren özel bileşen
  ExcelExportButton.tsx     ❌ özel buton bileşeni
  ExcelSutunSeciciModal.tsx ❌ tam bir modal bileşeni
  PdfGoruntuleyici.tsx      ❌ özel bileşen
  PdfOnizleButton.tsx       ❌ özel buton bileşeni
  PdfOnizlemeModal.tsx      ❌ tam bir modal bileşeni
  PdfViewerCore.tsx         ❌ özel bileşen
```

### Sorun:
`cod.md` Kural: `components/ui/` → "İş mantığı YOK". Ama 8 bileşen iş mantığı içeriyor. Bu bileşenler birden fazla modül tarafından kullanıldığı için `components/modules/` altına da girmiyor.

### Ne olmalı:
```
src/components/shared/        ← YENİ KLASÖR (paylaşılan özel bileşenler)
  DocxViewer.tsx
  DosyaGoruntule.tsx
  ExcelExportButton.tsx
  ExcelSutunSeciciModal.tsx
  PdfGoruntuleyici.tsx
  PdfOnizleButton.tsx
  PdfOnizlemeModal.tsx
  PdfViewerCore.tsx
```

> [!NOTE]
> Bu taşıma import yollarını değiştirir. Tüm kullanım yerlerinde
> `@/components/ui/PdfOnizleButton` → `@/components/shared/PdfOnizleButton` yapılmalı.
> Kaç yerde kullanıldığını kontrol et:

---

## SORUN 4 — `lib/` kök dizininde yalnız dosyalar

### Şu an ne var:
```
src/lib/
  cari.ts                    ❌ Tek başına — nereye ait?
  utils.ts                   ❌ Tek başına — utils/index.ts zaten var
  docx-sample-generator.ts   ❌ Tek başına — templates/ altına girmeli
  providers.tsx              ⚠️ Kabul edilebilir (app geneli)
```

### Sorun detayı:

**`lib/utils.ts`** → Sadece `cn()` fonksiyonunu içeriyor (`clsx` + `tailwind-merge`).
Bu fonksiyon `lib/utils/index.ts`'te de tanımlı olmayabilir — kontrol gerekli.
Eğer ikisi farklıysa birleştir, aynıysa `lib/utils.ts`'i sil.

**`lib/cari.ts`** → "Cari Modülü — Saf Yardımcı Fonksiyonlar" yazıyor.
Para birimi formatları, ödeme hesaplamaları gibi cari'ye özgü utils.
Bu `lib/utils/cari.ts` veya `lib/utils/evrak-utils.ts` gibi utils alt klasörüne girmeli.

**`lib/docx-sample-generator.ts`** → DOCX şablon üretici.
`lib/templates/` klasörü var ve benzer dosyalar orada. Buraya taşınmalı.

### Ne olmalı:
```
src/lib/
  providers.tsx              ✅ kalır
  utils/
    index.ts                 ✅ kalır
    cari.ts                  ← lib/cari.ts buraya taşınır
    evrak-utils.ts           ✅ zaten burada
    maasHesap.ts             ✅ zaten burada
    sort.ts                  ✅ zaten burada
  templates/
    docx-template.ts         ✅ zaten burada
    docx-sample-generator.ts ← lib/docx-sample-generator.ts buraya taşınır
    ozluk-generator.ts       ✅ zaten burada
    pdf-form.ts              ✅ zaten burada
    pdf-merge.ts             ✅ zaten burada
```

`lib/utils.ts` → `lib/utils/index.ts` ile birleştirilir, kök dosya silinir.

---

## SORUN 5 — `hooks/use-mobile.ts` adlandırma tutarsızlığı

### Şu an ne var:
```
src/hooks/
  use-mobile.ts      ← kebab-case (farklı)
  useAyarlar.ts      ← camelCase (standart)
  useBankaOdeme.ts   ← camelCase (standart)
  ...
```

### Sorun:
Tüm hook'lar `useBirSey.ts` formatında iken `use-mobile.ts` kebab-case. shadcn'den geldiği için bu şekilde kalmış.

### Ne olmalı:
`use-mobile.ts` → `useMobile.ts` olarak yeniden adlandır.
Kullanım yerlerini güncelle.

---

## SORUN 6 — `stores/index.ts` sadece re-export yapıyor

### Şu an ne var:
```ts
// src/stores/index.ts
export { useUIStore } from "./uiStore";
export { useSirketStore } from "./sirketStore";
```

### Sorun:
Bu dosya gereksiz bir aracı katman. Projede hiçbir yerde `@/stores` şeklinde import yapılmıyor, direkt `@/stores/uiStore` ve `@/stores/sirketStore` kullanılıyor. Dosya anlamsız.

`useGarajStore.ts` da `stores/` altına taşındığında buraya eklenmeli ya da bu dosya tamamen silinmeli.

### Ne olmalı:
Ya `index.ts`'i sil (direkt import'lara geç), ya da tutarlıysa tüm store'ları buradan import et.

---

## SORUN 7 — `types/` ile `supabase/` tip ayrımı belirsiz

### Şu an ne var:
```
src/types/
  index.ts        ← genel UI/domain tipleri
  bordro-form.ts  ← form tipleri
  cari.ts         ← cari domain tipleri
  evrak.ts        ← evrak tipleri

src/supabase/
  types.ts        ← ham Supabase generated tipleri
  app-types.ts    ← Tables<>, TablesInsert<> wrapper'ları
```

### Sorun:
`types/cari.ts` ve `supabase/app-types.ts`'teki `Tables<"cari">` arasındaki fark net değil.
Yeni geliştirici nereden import edeceğini bilemez.

### Ne olmalı:
Ayrım netleştirilmeli:
- `supabase/app-types.ts` → **DB satır tipleri** (`Tables<>`, `TablesInsert<>`)
- `types/*.ts` → **UI/form tipleri**, DB'den türetilmiş ama form veya görünüme özgü tipler

`types/index.ts` dosyasının başına bu farkı açıklayan bir yorum ekle.

---

## HEDEF YAPI

```
src/
├── app/
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── ayarlar.ts
│   │   ├── cari.ts
│   │   ├── evrak.ts
│   │   ├── garaj.ts         ✅ zaten var
│   │   ├── maas.ts
│   │   ├── personel.ts
│   │   ├── puantaj.ts
│   │   ├── search.ts
│   │   ├── sirket.ts
│   │   ├── storage.ts
│   │   └── tersane.ts
│   └── (dashboard)/...
│
├── components/
│   ├── layout/              ✅ AppSidebar, AppTopbar, vb.
│   ├── landing/             ✅ Landing sayfası bileşenleri
│   ├── shared/              🆕 Çok modüllü paylaşılan özel bileşenler
│   │   ├── DocxViewer.tsx
│   │   ├── DosyaGoruntule.tsx
│   │   ├── ExcelExportButton.tsx
│   │   ├── ExcelSutunSeciciModal.tsx
│   │   ├── PdfGoruntuleyici.tsx
│   │   ├── PdfOnizleButton.tsx
│   │   ├── PdfOnizlemeModal.tsx
│   │   └── PdfViewerCore.tsx
│   ├── modules/
│   │   ├── auth/
│   │   ├── ayarlar/
│   │   ├── bordro/
│   │   ├── cari/
│   │   ├── evrak/
│   │   ├── garaj/           🔄 components/garaj/'dan taşınır
│   │   ├── onboarding/      🔄 dashboard/OnboardingChecklist buraya
│   │   ├── personel/
│   │   ├── profil/
│   │   └── puantaj/
│   └── ui/                  ✅ Sadece shadcn primitifleri
│
├── hooks/
│   ├── useMobile.ts         🔄 use-mobile.ts yeniden adlandırılır
│   ├── useAyarlar.ts
│   ├── useBankaOdeme.ts
│   ├── useBordroForm.ts
│   ├── useCari.ts
│   ├── useEvrak.ts
│   ├── useFileDownload.ts
│   ├── useFileUpload.ts
│   ├── useMaasBordro.ts
│   ├── usePersonelDetay.ts
│   ├── usePersonelList.ts
│   ├── usePuantaj.ts
│   └── useTersane.ts
│
├── lib/
│   ├── providers.tsx
│   ├── auth/context.ts
│   ├── constants/index.ts
│   ├── excel/
│   ├── pdf/
│   ├── storage/
│   ├── templates/
│   │   ├── docx-sample-generator.ts  🔄 lib/kök'ten taşınır
│   │   ├── docx-template.ts
│   │   ├── ozluk-generator.ts
│   │   ├── pdf-form.ts
│   │   └── pdf-merge.ts
│   ├── utils/
│   │   ├── index.ts          🔄 lib/utils.ts ile birleştirilir
│   │   ├── cari.ts           🔄 lib/cari.ts buraya taşınır
│   │   ├── evrak-utils.ts
│   │   ├── maasHesap.ts
│   │   └── sort.ts
│   └── validations/
│
├── stores/
│   ├── garajStore.ts         🔄 components/garaj/useGarajStore.ts buraya
│   ├── sirketStore.ts
│   └── uiStore.ts
│   (index.ts silinir)
│
├── supabase/
│   ├── admin.ts
│   ├── app-types.ts
│   ├── client.ts
│   ├── middleware.ts
│   ├── server.ts
│   └── types.ts
│
└── types/
    ├── index.ts
    ├── bordro-form.ts
    ├── cari.ts
    ├── evrak.ts
    └── garaj.ts              🔄 components/garaj/types.ts buraya
```

---

## TAŞIMA LİSTESİ — Öncelik Sırası

### Adım 1 — Bağımsız, kolay taşımalar (import yolu değişmeden)

| Kaynak | Hedef | Risk |
|---|---|---|
| `lib/docx-sample-generator.ts` | `lib/templates/docx-sample-generator.ts` | Düşük |
| `hooks/use-mobile.ts` | `hooks/useMobile.ts` | Düşük (1-2 kullanım yeri) |
| `stores/index.ts` | Silinir | Düşük (zaten kullanılmıyor) |
| `components/dashboard/OnboardingChecklist.tsx` | `components/modules/onboarding/` | Düşük |

### Adım 2 — Import yolu değişen taşımalar

| Kaynak | Hedef | Etki |
|---|---|---|
| `lib/utils.ts` (`cn` fonksiyonu) | `lib/utils/index.ts` ile birleştir | Orta — tüm `@/lib/utils` importlarını kontrol et |
| `lib/cari.ts` | `lib/utils/cari.ts` | Orta — `@/lib/cari` kullananları güncelle |
| `components/garaj/types.ts` | `types/garaj.ts` | Orta — garaj bileşenlerinde import güncelle |

### Adım 3 — Büyük taşımalar (dikkatli yapılmalı)

| Kaynak | Hedef | Etki |
|---|---|---|
| `components/garaj/useGarajStore.ts` | `stores/garajStore.ts` | Yüksek — tüm garaj bileşenlerinde import güncelle |
| `components/garaj/*.tsx` (bileşenler) | `components/modules/garaj/` | Yüksek — route page'lerindeki importlar güncellenmeli |
| `components/ui/Pdf*.tsx`, `components/ui/Excel*.tsx`, `components/ui/Docx*.tsx`, `components/ui/Dosya*.tsx` | `components/shared/` | Yüksek — **çok sayıda kullanım yeri** |

### Adım 4 — Doğrulama

Taşıma tamamlandıktan sonra:
```bash
npm run build
```
Build hataları kalmadıysa tamamdır.

---

## KULLANIM YERİ ANALİZİ — Taşıma Öncesi Tespitler

| Dosya | Kullanım Yeri | Dosyalar |
|---|---|---|
| `components/ui/PdfOnizleButton` | 4 dosya | GenelPuantajView, ProjeAyPuantajTablosu, ProjePuantajView, PersonelListesiView |
| `components/ui/ExcelExportButton` | 3 dosya | GenelPuantajView, ProjeAyPuantajTablosu, ProjePuantajView |
| `components/ui/PdfOnizlemeModal` | 2 dosya | MaasListesiView, PdfOnizleButton (içinden) |
| `components/ui/ExcelSutunSeciciModal` | 2 dosya | MaasListesiView, PersonelListesiView |
| `components/ui/DosyaGoruntule` | 5 dosya | BelgeDosyaPanel, EvrakContent, PersonelEvraklar, SirketEvrakContent, PersonelDetayView |
| `components/ui/DocxViewer` | 0 dış kullanım | Sadece kendi tanımı |
| `components/garaj/useGarajStore` | 0 dış import | Sadece kendi tanımı |
| `components/garaj/types.ts` | 2 dosya | `actions/garaj.ts`, `GarajFiloGorunumu.tsx` |
| `lib/cari.ts` | 7 dosya | Cari modülü + `cariExport.ts` + `cariPdf.ts` + `actions/cari.ts` |
| `lib/utils.ts` (sadece `cn`) | 2 dosya | `GarajDetayEkrani.tsx`, `AppSidebar.tsx` — geri kalanlar zaten `lib/utils/index.ts` |
| `hooks/use-mobile.ts` | 1 dosya | `components/ui/sidebar.tsx` |
| `lib/docx-sample-generator.ts` | 1 dosya | `app/docx-test/page.tsx` |
| `stores/index.ts` | 0 dış kullanım | Sadece kendi tanımı |
| `components/dashboard/OnboardingChecklist.tsx` | 0 dış kullanım | Sadece kendi tanımı |

> [!NOTE]
> `lib/utils.ts` (sadece `cn`) ve `lib/utils/index.ts` farklı dosyalar — ikisi de `@/lib/utils` alias'ını paylaşıyor,
> TypeScript `index.ts`'i önceliklendirir. `lib/utils.ts` silinince 2 dosyada import yolu zaten çalışmaya devam eder.

---

## FIX ADIMLARI — PowerShell Komutları

> [!IMPORTANT]
> Her adımı sırayla uygula. Bir adımı tamamlamadan diğerine geçme.
> Her adım sonrası `npx tsc --noEmit` ile doğrula.

---

### ADIM 1 — Kolay Taşımalar (import yolu değişmez veya 1 yer)

#### 1a. `stores/index.ts` sil (kimse import etmiyor)

```powershell
Remove-Item src\stores\index.ts
```

#### 1b. `hooks/use-mobile.ts` → `hooks/useMobile.ts`

```powershell
Rename-Item -Path src\hooks\use-mobile.ts -NewName useMobile.ts

# Tek kullanım yeri: components/ui/sidebar.tsx
(Get-Content src\components\ui\sidebar.tsx -Raw) `
  -replace '@/hooks/use-mobile', '@/hooks/useMobile' |
  Set-Content src\components\ui\sidebar.tsx -Encoding UTF8
```

#### 1c. `lib/docx-sample-generator.ts` → `lib/templates/`

```powershell
Move-Item src\lib\docx-sample-generator.ts src\lib\templates\docx-sample-generator.ts

# Tek kullanım yeri: app/docx-test/page.tsx
(Get-Content src\app\docx-test\page.tsx -Raw) `
  -replace '@/lib/docx-sample-generator', '@/lib/templates/docx-sample-generator' |
  Set-Content src\app\docx-test\page.tsx -Encoding UTF8
```

#### 1d. `components/dashboard/OnboardingChecklist.tsx` → `components/modules/onboarding/`

```powershell
# 0 dış import var — güvenle taşı
Move-Item src\components\dashboard\OnboardingChecklist.tsx `
          src\components\modules\onboarding\OnboardingChecklist.tsx

# Eski klasörü sil (boşaldıysa)
Remove-Item src\components\dashboard -ErrorAction SilentlyContinue
```

---

### ADIM 2 — `lib/utils.ts` ile `lib/utils/index.ts` Birleştirme

`lib/utils.ts` = sadece `cn()` (5 satır). `lib/utils/index.ts` = para/tarih/bordro utils — `cn` YOK.
Çözüm: `cn`'yi `lib/utils/index.ts` başına ekle, `lib/utils.ts`'i sil.

```powershell
# index.ts'in başına cn ekle
$mevcutIcerik = Get-Content src\lib\utils\index.ts -Raw
$cnBlok = @'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

'@
($cnBlok + $mevcutIcerik) | Set-Content src\lib\utils\index.ts -Encoding UTF8

# Eski dosyayı sil
Remove-Item src\lib\utils.ts
```

---

### ADIM 3 — `lib/cari.ts` → `lib/utils/cari.ts`

```powershell
Move-Item src\lib\cari.ts src\lib\utils\cari.ts

# 7 kullanım yeri (+ 2 lib dosyası = 9 toplam)
$dosyalar = @(
  "src\app\actions\cari.ts",
  "src\components\modules\cari\BelgeDosyaPanel.tsx",
  "src\components\modules\cari\BelgeFormView.tsx",
  "src\components\modules\cari\BelgeDetayView.tsx",
  "src\components\modules\cari\BelgeListesiView.tsx",
  "src\components\modules\cari\FirmaListesiView.tsx",
  "src\components\modules\cari\OdemeEkleModal.tsx",
  "src\components\modules\cari\TopluOdemeModal.tsx",
  "src\lib\excel\cariExport.ts",
  "src\lib\pdf\cariPdf.ts"
)

foreach ($dosya in $dosyalar) {
  if (Test-Path $dosya) {
    (Get-Content $dosya -Raw) `
      -replace '@/lib/cari"', '@/lib/utils/cari"' |
      Set-Content $dosya -Encoding UTF8
  }
}
```

---

### ADIM 4 — `components/garaj/types.ts` → `types/garaj.ts`

```powershell
Move-Item src\components\garaj\types.ts src\types\garaj.ts

# 2 kullanım yeri
(Get-Content src\app\actions\garaj.ts -Raw) `
  -replace '@/components/garaj/types', '@/types/garaj' |
  Set-Content src\app\actions\garaj.ts -Encoding UTF8

(Get-Content src\components\garaj\GarajFiloGorunumu.tsx -Raw) `
  -replace '@/components/garaj/types', '@/types/garaj' |
  Set-Content src\components\garaj\GarajFiloGorunumu.tsx -Encoding UTF8
```

---

### ADIM 5 — `components/garaj/useGarajStore.ts` → `stores/garajStore.ts`

```powershell
Move-Item src\components\garaj\useGarajStore.ts src\stores\garajStore.ts

# Garaj bileşenlerinin içinde "./useGarajStore" relative import olabilir — güncelle
Get-ChildItem -Path src\components\garaj -Include "*.tsx","*.ts" -Recurse |
  ForEach-Object {
    (Get-Content $_.FullName -Raw) `
      -replace '"\./useGarajStore"', '"@/stores/garajStore"' `
      -replace '@/components/garaj/useGarajStore', '@/stores/garajStore' |
      Set-Content $_.FullName -Encoding UTF8
  }
```

---

### ADIM 6 — `components/garaj/*.tsx` → `components/modules/garaj/`

> [!CAUTION]
> Bu adım en büyük taşıma. Önce `npx tsc --noEmit` temiz çıkıyor olmalı.

```powershell
# Hedef klasörü oluştur
New-Item -ItemType Directory -Path src\components\modules\garaj -Force

# Tüm bileşen dosyalarını taşı
Get-ChildItem -Path src\components\garaj -Filter "*.tsx" |
  Move-Item -Destination src\components\modules\garaj\

# garajData.ts — içeriği kontrol et
$garajData = Get-Content src\components\garaj\garajData.ts -Raw -ErrorAction SilentlyContinue
if ($null -eq $garajData -or $garajData.Trim().Length -lt 50) {
  Remove-Item src\components\garaj\garajData.ts -ErrorAction SilentlyContinue
} else {
  Move-Item src\components\garaj\garajData.ts src\lib\constants\garajData.ts
}

# Eski klasörü sil
Remove-Item src\components\garaj -Recurse -ErrorAction SilentlyContinue

# Tüm projedeki @/components/garaj importlarını güncelle
Get-ChildItem -Path src -Recurse -Include "*.tsx","*.ts" |
  ForEach-Object {
    $icerik = Get-Content $_.FullName -Raw
    if ($icerik -match '@/components/garaj') {
      ($icerik -replace '@/components/garaj', '@/components/modules/garaj') |
        Set-Content $_.FullName -Encoding UTF8
    }
  }
```

---

### ADIM 7 — `components/ui/{8 bileşen}` → `components/shared/`

> [!CAUTION]
> Shared bileşenler birbirini import ediyor (PdfOnizleButton → PdfOnizlemeModal → PdfGoruntuleyici → PdfViewerCore).
> Tüm dosyalar önce taşınır, sonra importlar güncellenir.

```powershell
# Hedef klasörü oluştur
New-Item -ItemType Directory -Path src\components\shared -Force

# 8 dosyayı taşı
$paylasilan = @(
  "DocxViewer.tsx",
  "DosyaGoruntule.tsx",
  "ExcelExportButton.tsx",
  "ExcelSutunSeciciModal.tsx",
  "PdfGoruntuleyici.tsx",
  "PdfOnizleButton.tsx",
  "PdfOnizlemeModal.tsx",
  "PdfViewerCore.tsx"
)
foreach ($dosya in $paylasilan) {
  Move-Item "src\components\ui\$dosya" "src\components\shared\$dosya"
}

# Projedeki TÜM kaynak dosyalarda import yolunu güncelle
Get-ChildItem -Path src -Recurse -Include "*.tsx","*.ts" |
  ForEach-Object {
    $icerik = Get-Content $_.FullName -Raw
    if ($icerik -match '@/components/ui/(DocxViewer|DosyaGoruntule|ExcelExportButton|ExcelSutunSeciciModal|PdfGoruntuleyici|PdfOnizleButton|PdfOnizlemeModal|PdfViewerCore)') {
      $icerik `
        -replace '@/components/ui/DocxViewer',            '@/components/shared/DocxViewer' `
        -replace '@/components/ui/DosyaGoruntule',        '@/components/shared/DosyaGoruntule' `
        -replace '@/components/ui/ExcelExportButton',     '@/components/shared/ExcelExportButton' `
        -replace '@/components/ui/ExcelSutunSeciciModal', '@/components/shared/ExcelSutunSeciciModal' `
        -replace '@/components/ui/PdfGoruntuleyici',      '@/components/shared/PdfGoruntuleyici' `
        -replace '@/components/ui/PdfOnizleButton',       '@/components/shared/PdfOnizleButton' `
        -replace '@/components/ui/PdfOnizlemeModal',      '@/components/shared/PdfOnizlemeModal' `
        -replace '@/components/ui/PdfViewerCore',         '@/components/shared/PdfViewerCore' |
        Set-Content $_.FullName -Encoding UTF8
    }
  }
```

---

### ADIM 8 — `types/index.ts` Başına Yorum Ekle

```powershell
$mevcutIcerik = Get-Content src\types\index.ts -Raw
$yorum = @'
/**
 * BURAYI OKU: types/ vs supabase/ FARKI
 * ─────────────────────────────────────
 * supabase/app-types.ts  → DB satır tipleri (Tables<>, TablesInsert<>)
 *                          Supabase'den üretilmiş — doğrudan kullan
 *
 * types/*.ts             → UI / form tipleri
 *                          DB'den türetilmiş ama görünüm veya forma
 *                          özgü ek alanlar içerir (ör: BordroFormValues)
 */

'@
($yorum + $mevcutIcerik) | Set-Content src\types\index.ts -Encoding UTF8
```

---

### ADIM 9 — Son Doğrulama

```powershell
# TypeScript hata yok mu?
npx tsc --noEmit

# Next.js build temiz mi?
npm run build
```

Build hatasız geçerse tüm taşımalar tamamdır. ✅

---

## ÖZET — Taşıma Sırası

```
[1a] stores/index.ts              → SİL
[1b] hooks/use-mobile.ts          → hooks/useMobile.ts        (1 import güncelle)
[1c] lib/docx-sample-generator.ts → lib/templates/            (1 import güncelle)
[1d] components/dashboard/        → components/modules/onboarding/ (0 import)
[2]  lib/utils.ts (cn)            → lib/utils/index.ts ile birleştir
[3]  lib/cari.ts                  → lib/utils/cari.ts         (10 import güncelle)
[4]  components/garaj/types.ts    → types/garaj.ts            (2 import güncelle)
[5]  components/garaj/useGarajStore.ts → stores/garajStore.ts
[6]  components/garaj/*.tsx       → components/modules/garaj/ (tüm proje tarama)
[7]  components/ui/{8 dosya}      → components/shared/        (tüm proje tarama)
[8]  types/index.ts               → yorum ekle (kod değişmez)
[9]  npx tsc --noEmit + npm run build (doğrulama)
```

---

*Rapor tarihi: 2026-10-17*
*Toplam sorun: 7 başlık — 9 fix adımı — 15 somut taşıma işlemi*
