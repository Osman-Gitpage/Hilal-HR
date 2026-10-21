# Puantaj Modülü — Tüm Dosyalar

> Proje kökü: `c:\Users\bilgi\muhasebe`

---

## 🗺️ Routes (App Router)

| Dosya | Satır | Açıklama |
|---|---|---|
| `src/app/(dashboard)/puantaj/layout.tsx` | 75 | Puantaj modülü layout — tab navigasyonu |
| `src/app/(dashboard)/puantaj/page.tsx` | 6 | Genel puantaj sayfası |
| `src/app/(dashboard)/puantaj/proje/page.tsx` | 6 | Proje puantajı sayfası |
| `src/app/(dashboard)/puantaj/projeler/page.tsx` | 6 | Projeler listesi sayfası |
| `src/app/(dashboard)/puantaj/projeler/[id]/page.tsx` | — | Proje detay sayfası (dinamik route) |

---

## ⚙️ Server Actions

| Dosya | Satır | Açıklama |
|---|---|---|
| `src/app/actions/puantaj.ts` | **1438** | Tüm puantaj server action'ları |

---

## 🧩 Bileşenler

| Dosya | Satır | Açıklama |
|---|---|---|
| `src/components/modules/puantaj/GenelPuantajView.tsx` | **994** | Ana genel puantaj görünümü |
| `src/components/modules/puantaj/ProjelerView.tsx` | **1030** | Projeler listesi görünümü |
| `src/components/modules/puantaj/ProjePuantajView.tsx` | 715 | Proje puantaj görünümü |
| `src/components/modules/puantaj/GunVeriGirisiModal.tsx` | 673 | Gün bazlı veri girişi modalı |
| `src/components/modules/puantaj/TopluGunGirisiPanel.tsx` | 631 | Toplu gün girişi paneli |
| `src/components/modules/puantaj/ProjeAyPuantajTablosu.tsx` | 562 | Proje-ay bazlı puantaj tablosu |
| `src/components/modules/puantaj/ProjeDetayView.tsx` | 483 | Proje detay görünümü |
| `src/components/modules/personel/PersonelPuantajTab.tsx` | **959** | Personel detayındaki puantaj sekmesi |

---

## 🪝 Hooks

| Dosya | Satır | Açıklama |
|---|---|---|
| `src/hooks/usePuantaj.ts` | 565 | TanStack Query hooks — tüm puantaj sorguları |

---

## 📤 Dışa Aktarım

| Dosya | Satır | Açıklama |
|---|---|---|
| `src/lib/pdf/puantajPdf.ts` | 793 | jsPDF ile puantaj PDF üretimi |
| `src/lib/excel/puantajExport.ts` | 477 | xlsx ile Excel dışa aktarımı |

---

## ✅ Validasyonlar

| Dosya | Satır | Açıklama |
|---|---|---|
| `src/lib/validations/puantaj.ts` | 84 | Zod şemaları — form ve action validasyonu |

---

## 📊 Özet

| | Sayı |
|---|---|
| Toplam dosya | **18** |
| Toplam satır | ~**9.026** |
| En büyük dosya | `actions/puantaj.ts` — 1438 satır |
| En büyük bileşen | `ProjelerView.tsx` — 1030 satır |

> [!WARNING]
> `actions/puantaj.ts` (1438 satır) ve büyük bileşenler domain bazında parçalanabilir.
> `cod.md` Kural 6: Bileşen 150 satırı geçiyorsa alt bileşenlere böl.
