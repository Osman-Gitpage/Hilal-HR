# COD.MD — Muhasebe Projesi Kodlama Kuralları

> **Stack:** Next.js 16 · React 19 · TypeScript · Supabase · TanStack Query · Zustand · Tailwind v4 · Zod

---

## 1. DOSYA & KLASÖR YAPISI

```
src/
├── app/
│   ├── actions/          # Yalnızca Server Actions (her domain → ayrı dosya)
│   ├── (dashboard)/      # Route grupları — layout paylaşımı için
│   └── api/              # Route Handlers (webhook, proxy vb.)
├── components/
│   ├── ui/               # shadcn/ui primitifleri — iş mantığı YOK
│   ├── layout/           # Sidebar, Topbar, global bileşenler
│   └── modules/          # Domain bazlı bileşenler (bordro/, personel/ …)
├── hooks/                # use* — veri çekme ve türetilmiş state
├── lib/
│   ├── constants/        # Sabitler (QUERY_KEYS, format sabitleri)
│   ├── pdf/ excel/       # Dışa aktarım yardımcıları
│   ├── utils/            # Saf yardımcı fonksiyonlar
│   └── validations/      # Zod şemaları (domain bazlı)
├── stores/               # Zustand store (global UI state)
├── supabase/             # Client + tip üretimi
└── types/                # Paylaşılan TypeScript tipleri
```

**Kural:** Bir dosyayı nereye koyacağını bilemiyorsan önce bu yapıya bak.  
Yeni domain → `components/modules/<domain>/` + `app/actions/<domain>.ts` + `hooks/use<Domain>.ts`

---

## 2. KOPYALA-YAPIŞTIRIR SORUNLARINI ÖNLEME

### ❌ YAPMA
```ts
// Aynı formatlama 5 farklı bileşende tekrar edilmiş
const formatted = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);
```

### ✅ YAP
```ts
// lib/utils/index.ts'deki merkezi fonksiyonu kullan
import { formatPara, formatTarih, formatAdSoyad } from "@/lib/utils";
```

**Kural:** Aynı mantığı iki yerde yazmadan önce `lib/utils/` veya ilgili `lib/` alt klasörüne taşı.

---

## 3. SERVER ACTIONS

```ts
// app/actions/personel.ts
"use server";

import { getAuthContext } from "@/lib/auth/context"; // Her action bu ile başlar
import { revalidatePath } from "next/cache";

export async function personelEkle(input: PersonelInsert) {
  const { supabase, sirketId } = await getAuthContext(); // ← zorunlu güvenlik

  const { error } = await supabase
    .from("personel")
    .insert({ ...input, sirket_id: sirketId });

  if (error) throw new Error(error.message); // ← hata fırlat, sessizce yutma

  revalidatePath("/personel");
}
```

**Kurallar:**
- Her action başında `getAuthContext()` — asla atla.
- `return { success, error }` yerine ya değer döndür ya `throw` yap.
- Bir action birden fazla domain'e dokunuyorsa ikiye böl.
- `/* eslint-disable @typescript-eslint/no-explicit-any */` kullanma — tip yaz.

---

## 4. VERİ ÇEKME — TanStack Query

```ts
// hooks/usePersonelList.ts
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { personelListesiGetir } from "@/app/actions/personel";

export function usePersonelList(sirketId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.personelListesi(sirketId),
    queryFn: () => personelListesiGetir(),
    staleTime: 30_000,
  });
}
```

**Kurallar:**
- `queryKey` her zaman `QUERY_KEYS` sabitinden gelir — string literal yok.
- Bileşen içinde `fetch` veya Supabase çağrısı yok — hook kullan.
- `invalidateQueries` → `queryClient.invalidateQueries({ queryKey: QUERY_KEYS.xyz })`.

---

## 5. ZUSTAND — GLOBAL STATE

```ts
// stores/uiStore.ts  — Yalnızca UI state burada
// stores/sirketStore.ts — Oturum/şirket bilgisi burada

// ❌ İş mantığı store'a girmesin
// ✅ Store yalnızca: modal aç/kapat, seçili id, filtre, dönem
```

**Kurallar:**
- Sunucudan gelen veri → TanStack Query (store'a kopyalama).
- Zustand store'u domain değil, **UI bağlamı** taşır.
- Her `set()` çağrısı tek bir slice'ı günceller.

---

## 6. REACT BİLEŞEN KURALLARI

```tsx
// ✅ Küçük alt bileşenleri aynı dosyada tanımla (dosya başı)
function KpiKart({ baslik, deger, yukleniyor }: KpiKartProps) { … }

// ✅ Props tipi her zaman explicit
interface PersonelSatirProps {
  personel: PersonelListeItem;
  onDetay: (id: string) => void;
}

// ❌ any kullanma
// ✅ Supabase tiplerini kullan: import type { PersonelRow } from "@/supabase/app-types"
```

**Kurallar:**
- Bileşen 150 satırı geçiyorsa → alt bileşenlere böl veya ayrı dosyaya çıkar.
- `useState` + `useEffect` ile veri çekme yok — hook kullan.
- `useTransition` → sunucu action çağrıları için kullan.
- Yükleme: `<Skeleton>` · Hata: `toast.error(...)` · Başarı: `toast.success(...)`.

---

## 7. FORM & VALİDASYON

```ts
// lib/validations/personel.ts
import { z } from "zod";

export const PersonelEkleSchema = z.object({
  ad: z.string().min(2, "En az 2 karakter"),
  soyad: z.string().min(2),
  tc: z.string().length(11),
});

export type PersonelEkleInput = z.infer<typeof PersonelEkleSchema>;
```

**Kurallar:**
- Her domain için ayrı Zod şema dosyası (`lib/validations/<domain>.ts`).
- Şemayı hem action'da (server) hem formda (client) kullan — tekrarlama yok.
- `z.infer<typeof Schema>` → tip türetme, manuel tip yazma.

---

## 8. TİP GÜVENLİĞİ

```ts
// ✅ Supabase'den gelen tipler
import type { Tables, TablesInsert } from "@/supabase/app-types";
type PersonelRow    = Tables<"personel">;
type PersonelInsert = TablesInsert<"personel">;

// ❌ as any, as unknown as X — geçici çözüm bile olsa
// ✅ Tip assertion gerekiyorsa: satisfies veya explicit cast + yorum
```

---

## 9. QUERY KEYS SABİTLERİ

```ts
// lib/constants/index.ts
export const QUERY_KEYS = {
  personelListesi: (sirketId: string) => ["personel", sirketId] as const,
  personelDetay:   (id: string)       => ["personel", id, "detay"] as const,
  bordroListesi:   (sirketId: string, yil: number, ay: number) =>
                     ["bordro", sirketId, yil, ay] as const,
  // Yeni key → buraya ekle, bileşende string literal yazma
} as const;
```

---

## 10. IMPORT SIRASI

```ts
// 1. React & Next.js
import { useState } from "react";
import { useRouter } from "next/navigation";

// 2. Üçüncü parti
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// 3. UI primitifleri
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 4. İç modüller (actions, hooks, lib, stores)
import { usePersonelList } from "@/hooks/usePersonelList";
import { formatPara } from "@/lib/utils";

// 5. Yerel bileşenler (aynı klasör)
import { PersonelDetayModal } from "./PersonelDetayModal";
```

---

## 11. DOSYA BAZINDA SORUMLULUK SINIRLARI

| Dosya Türü | İzinli | Yasak |
|---|---|---|
| `app/actions/*.ts` | Supabase sorguları, revalidatePath | JSX, useState |
| `hooks/use*.ts` | useQuery, useMutation, türetilmiş hesap | JSX, Supabase direkt |
| `components/ui/*` | Stil, erişilebilirlik | İş mantığı, fetch |
| `components/modules/*` | Hook kullanımı, UI kompozisyonu | Direkt Supabase |
| `lib/utils/*` | Saf fonksiyonlar | Side effect, API çağrısı |
| `stores/*` | UI state | Sunucu verisi |

---

## 12. GENEL KISA KURALLAR

- **DRY:** Aynı satırı iki kez yazıyorsan fonksiyon çıkar.
- **Türkçe değişken adları** projeye uygun — tutarlı ol, karıştırma (`personelId` + `id` = ❌).
- `console.log` commit'e girmesin — `dev` ortamında bile kaldır.
- Her yeni bileşen/action → ilgili `QUERY_KEYS` ve `revalidatePath` kontrolü yap.
- Encoding sorunu (bozuk Türkçe karakter) → dosyayı **UTF-8 BOM'suz** kaydet.
- Section ayırıcı olarak `// ─── Başlık ───` kullan, ASCII box art kullanma.

---

*Bu dosya kodlama standardı referansıdır. Yeni pattern eklendiğinde buraya da ekle.*
