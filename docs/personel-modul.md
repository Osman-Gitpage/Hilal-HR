# Personel Modülü

## Main Info

**Stack:** Next.js, Supabase, Tailwind, shadcn/ui  
**State:** Zustand (UI), TanStack Query (veri)

### Tablolar

**personel**
| Alan | Zorunlu | Notlar |
|------|---------|--------|
| id (uuid) | * | |
| ad | * | |
| soyad | * | |
| tc | * | |
| dogum_tarihi | | |
| cinsiyet | | |
| sgk_sicil | | |
| gorev_unvan | | |
| maas_net | * | |
| banka_adi | | |
| sube_kodu | | |
| hesap_no | | |
| iban | | |

> Banka: IBAN **veya** (şube kodu + hesap no) girilmesi yeterli

**employment_periods**
| Alan | Notlar |
|------|--------|
| id | |
| personel_id | FK → personel |
| baslangic_tarihi | |
| bitis_tarihi | null = hâlâ çalışıyor |
| tur | aktif, emekli, istifa vb. |

> Puantaj ve maaş modülleri ilgili ayı hesaplarken bu tabloyu kullanır.

---

## Sayfa 1 — Personel Listesi

- KPI kartları (aktif personel sayısı vb.)
- Tabs: **Aktif** / **Arşiv (Çıkışlı)**
- Tablo kolonları (Aktif): Ad Soyad, Görev/Unvan, İşe Giriş Tarihi, Maaş Net, Durum, İşlemler
- Tablo kolonları (Arşiv): Ad Soyad, Görev/Unvan, İşten Çıkış Tarihi, İşlemler
- Butonlar: Hızlı Ekle (Dialog), Personel Ekle (Sayfa 3'e yönlendir)

---

## Sayfa 2 — Personel Detay

**Üst Kart:** Ad Soyad, TC, Cinsiyet, Doğum Tarihi, Durum badge, Düzenle butonu

**Tabs:**
1. Genel Bilgiler — kişisel + banka bilgileri
2. Çalışma Geçmişi — employment_periods listesi
3. Maaş Geçmişi — aylık ödemeler
4. Puantaj — aylık çalışma saatleri özeti
5. Evraklar — personele ait belgeler

---

## Sayfa 3 — Personel Ekle (Tam Form)

Tüm alanlar mevcut (zorunlu + opsiyonel)

---

## Dialog — Hızlı Personel Ekle

Sadece zorunlu alanlar:
- Ad, Soyad, TC, İşe Giriş Tarihi, Maaş Net
- Banka: IBAN **veya** (Şube Kodu + Hesap No)
