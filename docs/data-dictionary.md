# Veri Sözlüğü — Hilal HR

Sistemde kullanılan tüm alan adlarının Türkçe–Teknik karşılıkları.

---

## Genel Kurallar

| Kural | Değer |
|-------|-------|
| DB tablo adı formatı | `snake_case` |
| DB kolon adı formatı | `snake_case` |
| TypeScript tip formatı | `PascalCase` |
| Bileşen adı formatı | `PascalCase` |
| Hook adı formatı | `camelCase` + `use` prefix |
| Store adı formatı | `camelCase` + `Store` suffix |
| Yardımcı fonksiyon formatı | `camelCase` |
| Para birimi saklama | `numeric` (formatting: display only) |
| Tarih formatı (DB) | ISO 8601 (`YYYY-MM-DD`) |
| Tarih formatı (UI) | `dd.MM.yyyy` |
| Dönem formatı (UI) | `MMMM yyyy` (Türkçe) |

---

## Alan Adı Sözlüğü

### Ortak Alanlar

| DB Kolon | TypeScript | Türkçe Açıklama |
|----------|-----------|-----------------|
| `id` | `id` | Tekil kimlik (UUID) |
| `created_at` | `created_at` | Oluşturulma tarihi |
| `updated_at` | `updated_at` | Son güncelleme tarihi |
| `sirket_id` | `sirket_id` | Şirket FK |

### Personel Alanları

| DB Kolon | TypeScript | Türkçe |
|----------|-----------|--------|
| `ad` | `ad` | İsim |
| `soyad` | `soyad` | Soyisim |
| `tc` | `tc` | TC Kimlik Numarası |
| `dogum_tarihi` | `dogum_tarihi` | Doğum Tarihi |
| `cinsiyet` | `cinsiyet` | Cinsiyet (`erkek`/`kadin`) |
| `sgk_sicil` | `sgk_sicil` | SGK Sicil Numarası |
| `gorev_unvan` | `gorev_unvan` | Görev / Unvan |
| `telefon` | `telefon` | Telefon Numarası |
| `email` | `email` | E-posta |
| `adres` | `adres` | Adres |
| `banka_adi` | `banka_adi` | Banka Adı |
| `sube_kodu` | `sube_kodu` | Şube Kodu |
| `hesap_no` | `hesap_no` | Hesap Numarası |
| `iban` | `iban` | IBAN |

### İstihdam Dönemi Alanları

| DB Kolon | TypeScript | Türkçe |
|----------|-----------|--------|
| `personel_id` | `personel_id` | Personel FK |
| `baslangic_tarihi` | `baslangic_tarihi` | İşe Giriş Tarihi |
| `bitis_tarihi` | `bitis_tarihi` | İşten Çıkış Tarihi (NULL = aktif) |
| `ise_baslama_nedeni` | `ise_baslama_nedeni` | İşe Başlama Nedeni |
| `ayrilma_nedeni` | `ayrilma_nedeni` | Ayrılma Nedeni |

### Maaş Geçmişi Alanları

| DB Kolon | TypeScript | Türkçe |
|----------|-----------|--------|
| `maas_net` | `maas_net` | Net Maaş (TL) |
| `gecerlilik_baslangic` | `gecerlilik_baslangic` | Geçerlilik Başlangıcı |
| `gecerlilik_bitis` | `gecerlilik_bitis` | Geçerlilik Bitişi (NULL = güncel) |
| `aciklama` | `aciklama` | Açıklama / Zam Notu |

### Bordro Alanları

| DB Kolon | TypeScript | Türkçe |
|----------|-----------|--------|
| `donem_yil` | `donem_yil` | Dönem Yılı |
| `donem_ay` | `donem_ay` | Dönem Ayı (1–12) |
| `calisma_saati` | `calisma_saati` | Çalışma Saati |
| `mesai_saati` | `mesai_saati` | Mesai Saati |
| `yol` | `yol` | Yol Ücreti |
| `yemek` | `yemek` | Yemek Ücreti |
| `prim` | `prim` | Prim |
| `tazminat` | `tazminat` | Tazminat |
| `senelik_izin` | `senelik_izin` | Senelik İzin Ücreti |
| `banka` | `banka` | Banka Ödemesi |
| `bes` | `bes` | BES Kesintisi |
| `avans` | `avans` | Avans Kesintisi |
| `icra` | `icra` | İcra Kesintisi |
| `iceri_avans_kesinti` | `iceri_avans_kesinti` | İçeri Avans Kesintisi |
| `ek_odemeler` | `ek_odemeler` | Ek Ödemeler (JSON, max 4) |
| `ek_kesintiler` | `ek_kesintiler` | Ek Kesintiler (JSON, max 4) |
| `notlar` | `notlar` | Notlar (JSON, max 4) |
| `toplam_odeme` | `toplam_odeme` | Toplam Ödeme |
| `toplam_kesinti` | `toplam_kesinti` | Toplam Kesinti |
| `elden` | `elden` | Elden Ödeme |

### Banka Ödeme Alanları

| DB Kolon | TypeScript | Türkçe |
|----------|-----------|--------|
| `bordro_id` | `bordro_id` | Bordro FK |
| `elden_banka` | `elden_banka` | Elden (Banka sayfası) |

### Ayarlar Alanları

| DB Kolon | TypeScript | Türkçe |
|----------|-----------|--------|
| `gunluk_calisma_saati` | `gunluk_calisma_saati` | Günlük Çalışma Saati |
| `aylik_calisma_saati` | `aylik_calisma_saati` | Aylık Çalışma Saati |
| `resmi_tatiller` | `resmi_tatiller` | Resmi Tatiller |

---

## TypeScript Tip Kısayolları

```typescript
// src/supabase/types.ts içinden
import type {
  Sirket,
  Personel,
  EmploymentPeriod,
  MaasGecmisi,
  MaasBordro,
  BankaOdeme,
  Ayarlar,
  KullaniciSirket,
  PersonelInsert,
  PersonelUpdate,
  MaasBordroInsert,
  MaasBordroUpdate,
} from "@/supabase/types";
```

---

## Hesaplama Formülleri

```
saatlik_ucret     = maas_net / aylik_calisma_saati
hak_edis          = calisma_saati × saatlik_ucret
mesai_bedeli      = mesai_saati × saatlik_ucret        // 1× çarpan
toplam_odeme      = hak_edis + mesai_bedeli + yol + yemek + prim + tazminat + senelik_izin + Σek_odemeler
toplam_kesinti    = banka + bes + avans + icra + iceri_avans_kesinti + Σek_kesintiler
elden             = toplam_odeme - toplam_kesinti

// Banka sayfası:
elden_banka       = toplam_odeme - (banka + bes + tazminat + avans)
```
