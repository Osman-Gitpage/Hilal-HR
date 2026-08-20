# Şirket Değiştirme (Multi-Tenant Company Switcher) Hata Analizi ve Çözüm Planı (fix.md)

## 📌 Hatanın Sebepleri (Root Cause Analysis)

Projede şirket değiştirme özelliğinin çalışmamasının **2 temel nedeni** (biri Frontend, diğeri Backend/Server Action) bulunmaktadır:

---

### 1. Frontend Sıfırlama Hatası (`src/components/layout/AppTopbar.tsx`)

**Sorunun Detayı:**
`AppTopbar.tsx` bileşenindeki `useEffect` kancası (hooks), sayfa her yüklendiğinde veya yenilendiğinde veritabanından gelen şirket listesinin ilk elemanını (`sirketler[0]`) aktif şirket olarak kabul edip Zustand store'u ve cookie'yi üzerine yazmaktadır.

**İlgili Kod Bloğu (`src/components/layout/AppTopbar.tsx` - Satır 44-51):**
```typescript
// İlk yüklemede aktif şirketi store'a ve cookie'ye yaz
useEffect(() => {
  if (sirketler.length === 0) return;
  const sirket = ilkSirket(sirketler[0]);
  if (!sirket) return;
  if (aktifSirketId === sirket.id) return;
  setAktifSirket(sirket);
  sirketAyarla(sirket.id);
}, [sirketler, aktifSirketId, setAktifSirket]);
```

**Neden Bozuluyor?:**
1. Kullanıcı Dropdown menüden **2. Şirketi** seçer.
2. `handleSirketDegistir` tetiklenir, Zustand store'a 2. Şirket yazılır ve `sirketAyarla(sirket2.id)` ile cookie güncellenerek `window.location.reload()` çalışır.
3. Sayfa yeniden yüklendiğinde `AppTopbar` tekrar mount olur.
4. `useEffect` tetiklenir ve `sirketler[0]` (yani 1. Şirket) ile `aktifSirketId` (yani 2. Şirket) karşılaştırılır (`aktifSirketId === sirket.id`).
5. Bu eşitlik `false` döndüğü için `useEffect` seçimi derhal ezerek tekrar **1. Şirket** yapar ve cookie'ye 1. Şirketi yazar.
6. Sonuç olarak kullanıcı ne seçerse seçsin sayfa yenilendiğinde sistem 1. Şirkete geri döner.

---

### 2. Backend Server Action Cookie İhmali (`src/lib/auth/context.ts` ve Server Action'lar)

**Sorunun Detayı:**
Server Action'ların (`personel.ts`, `puantaj.ts`, `evrak.ts`, `cari.ts`, `ayarlar.ts`, `tersane.ts` vb.) bağlam oluşturmak için kullandığı `getAuthContext()` yardımcı fonksiyonu, kullanıcının `aktif_sirket_id` cookie'sini **hiç okumamaktadır**. Bunun yerine veritabanından `.limit(1).maybeSingle()` ile kullanıcının ilk şirketini çekmektedir.

**İlgili Kod Bloğu (`src/lib/auth/context.ts` - Satır 43-48):**
```typescript
const { data: ks, error: ksError } = await supabase
  .from("kullanici_sirket")
  .select("sirket_id, rol")
  .eq("kullanici_id", user.id)
  .limit(1)
  .maybeSingle();
```

**Neden Bozuluyor?:**
Kullanıcı istemci tarafında başka bir şirket seçmiş olsa bile, sunucu tarafında (Server Action'larda) yapılan sorgular kullanıcıya ait ilk şirket kaydı üzerinde çalışmakta ve multi-tenant veri izolasyonu bozularak yanlış şirkete ait veriler işlem görmektedir.

---

## 🛠️ Çözüm ve Düzeltme Adımları (Fixing Steps)

### Adım 1: `src/lib/auth/context.ts` İçinde Cookie Desteği Sağlama

`getAuthContext()` fonksiyonunu `cookies()` kullanarak `aktif_sirket_id` cookie'sini okuyacak şekilde güncelleyin:

```typescript
import { createClient } from "@/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  // Active company cookie check
  const cookieStore = await cookies();
  const cookieSirketId = cookieStore.get("aktif_sirket_id")?.value;

  const { data: sirketler, error: ksError } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id, rol")
    .eq("kullanici_id", user.id);

  if (ksError) throw new Error(`Şirket sorgusu başarısız: ${ksError.message}`);
  if (!sirketler || sirketler.length === 0) {
    throw new Error("Bu kullanıcıya ait şirket kaydı bulunamadı.");
  }

  // Cookie'deki şirket varsa onu kullan, yoksa ilk şirketi seç
  const mevcudSirket = cookieSirketId
    ? sirketler.find((s) => s.sirket_id === cookieSirketId)
    : undefined;

  const ks = mevcudSirket ?? sirketler[0];

  return {
    supabase,
    user,
    sirketId: ks.sirket_id,
    rol: ks.rol,
  };
}
```

---

### Adım 2: `AppTopbar.tsx` İçindeki `useEffect` Sıfırlama Mantığını Düzeltme

`AppTopbar.tsx` içerisindeki `useEffect` kancasını, eğer `aktifSirketId` zaten geçerli şirket listesinde bulunuyorsa değiştirmeyecek, yalnızca `aktifSirketId` boş ise veya liste içinde eşleşmeyen geçersiz bir ID ise varsayılan şirketi seçecek şekilde güncelleyin:

```typescript
// İlk yüklemede aktif şirketi doğrulama ve senkronize etme
useEffect(() => {
  if (sirketler.length === 0) return;

  // Mevcut aktifSirketId şirketler dizisinde var mı?
  const mevcutSirket = sirketler.find((ks) => ilkSirket(ks)?.id === aktifSirketId);

  if (mevcutSirket) {
    const sirketObj = ilkSirket(mevcutSirket);
    if (sirketObj && (!useSirketStore.getState().aktifSirket || useSirketStore.getState().aktifSirket?.id !== sirketObj.id)) {
      setAktifSirket(sirketObj);
    }
  } else {
    // Aktif şirket seçilmemişse veya listede yoksa ilk şirketi seç
    const ilk = ilkSirket(sirketler[0]);
    if (ilk) {
      setAktifSirket(ilk);
      sirketAyarla(ilk.id);
    }
  }
}, [sirketler, aktifSirketId, setAktifSirket]);
```

---

### Adım 3: Diğer Server Action Dosyalarındaki Yerel `getAuthContext` Tanımlarını Temizleme

`personel.ts`, `puantaj.ts`, `evrak.ts`, `ayarlar.ts`, `tersane.ts` dosyalarında ayrı ayrı kopyalanmış olan yerel `getAuthContext()` veya `getSirketId()` fonksiyonlarını silip `@/lib/auth/context` modülünden import edin:

```typescript
import { getAuthContext, getSirketId } from "@/lib/auth/context";
```

---

## 🚀 Doğrulama Testi (Verification Plan)

1. **Şirket Değiştirme Testi:**
   - Dropdown menüden 2. Şirkete geçin.
   - Sayfa yenilendiğinde (Reload) veya başka bir sayfaya (`/personel`, `/bordro`, `/puantaj`) geçildiğinde active şirketinizin hâlâ 2. Şirket kaldığını ve verilerin 2. Şirkete göre süzüldüğünü doğrulayın.

2. **Server Action Testi:**
   - 2. Şirket seçiliyken yeni personel ekleyin veya puantaj kaydedin. Verinin 1. Şirkete değil, seçili olan 2. Şirketin `sirket_id` değerine kaydedildiğini doğrulayın.
