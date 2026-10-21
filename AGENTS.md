<!-- BEGIN:nextjs-agent-rules -->
# Bu Next.js bildiğin Next.js değil

Bu sürümde kırıcı değişiklikler var — API'lar, convention'lar ve dosya yapısı eğitim verilerinden farklı olabilir.
Kod yazmadan önce `node_modules/next/dist/docs/` içindeki ilgili kılavuzu oku. Deprecation uyarılarını dikkate al.
<!-- END:nextjs-agent-rules -->

---

<!-- BEGIN:project-coding-rules -->
# Proje Kodlama Standartları

Bu projedeki **her kod değişikliğinden önce** `cod.md` dosyasını oku ve kurallarına tam uy.

```
c:\Users\bilgi\muhasebe\cod.md
```

## Zorunlu Okuma Sırası

1. `cod.md` → proje kodlama kuralları (DRY, mimari, tip güvenliği, server actions…)
2. `node_modules/next/dist/docs/` → Next.js 16 API değişiklikleri
3. `src/lib/constants/index.ts` → QUERY_KEYS sabitleri
4. `src/lib/auth/context.ts` → getAuthContext (her server action'da zorunlu)

## Hızlı Başvuru — En Kritik Kurallar

| Durum | Yap | Yapma |
|---|---|---|
| Veri çekme | `useQuery` hook | `fetch` / Supabase direkt bileşende |
| Formatlama | `formatPara`, `formatTarih` (`@/lib/utils`) | Inline `Intl.NumberFormat` |
| Server action | `getAuthContext()` ile başla | `sirket_id` manuel al |
| Tipler | `Tables<"tablo">` (`@/supabase/app-types`) | `any`, `unknown as X` |
| Query key | `QUERY_KEYS.xyz` sabitinden | String literal |
| Hata yönetimi | `throw new Error(...)` | `return { error }` veya sessiz yutma |
| State | Sunucu verisi → Query, UI → Zustand | Sunucu verisini store'a kopyalama |

## Stack

- **Framework:** Next.js 16 (App Router) · React 19
- **Veritabanı:** Supabase (RLS aktif — `sirket_id` her sorguda zorunlu)
- **Veri:** TanStack Query v5
- **Global state:** Zustand v5
- **Stil:** Tailwind v4 · shadcn/ui
- **Validasyon:** Zod
- **Dışa aktarım:** jsPDF · xlsx · docxtemplater

## Encoding

Tüm dosyalar **UTF-8 BOM'suz** kaydedilmeli. Bozuk Türkçe karakter (`?` veya `â`) görürsen
dosyayı yeniden UTF-8 olarak kaydet.
<!-- END:project-coding-rules -->
