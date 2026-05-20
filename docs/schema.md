# Veritabanı Şeması — Hilal HR

> Tablo isimleri: `snake_case` | Kolon isimleri: `snake_case`
> TypeScript tipleri: `src/supabase/types.ts`

---

## Tablolar

### `sirketler`
Çok firmalı yapının temel tablosu.

| Kolon | Tip | Zorunlu | Açıklama |
|-------|-----|---------|----------|
| `id` | uuid PK | ✓ | Otomatik |
| `ad` | text | ✓ | Şirket adı |
| `vergi_no` | text | | Vergi numarası |
| `adres` | text | | Şirket adresi |
| `telefon` | text | | Şirket telefonu |
| `email` | text | | Şirket e-postası |
| `logo_url` | text | | Logo dosyası URL |
| `created_at` | timestamptz | ✓ | Oluşturulma tarihi |
| `updated_at` | timestamptz | ✓ | Güncellenme tarihi |

---

### `kullanici_sirket`
Kullanıcı–Şirket ilişkisi ve rol yönetimi.

| Kolon | Tip | Zorunlu | Açıklama |
|-------|-----|---------|----------|
| `id` | uuid PK | ✓ | |
| `kullanici_id` | uuid FK | ✓ | `auth.users.id` |
| `sirket_id` | uuid FK | ✓ | `sirketler.id` |
| `rol` | enum | ✓ | `admin`, `editor`, `viewer` |
| `created_at` | timestamptz | ✓ | |

**Kısıtlama:** `UNIQUE(kullanici_id, sirket_id)`

---

### `personel`
Çalışan temel bilgileri.

| Kolon | Tip | Zorunlu | Açıklama |
|-------|-----|---------|----------|
| `id` | uuid PK | ✓ | |
| `sirket_id` | uuid FK | ✓ | `sirketler.id` |
| `ad` | text | ✓ | |
| `soyad` | text | ✓ | |
| `tc` | text | ✓ | TC Kimlik No |
| `dogum_tarihi` | date | | |
| `cinsiyet` | enum | | `erkek`, `kadin` |
| `sgk_sicil` | text | | SGK Sicil No |
| `gorev_unvan` | text | | Görev/Unvan |
| `telefon` | text | | |
| `email` | text | | |
| `adres` | text | | |
| `banka_adi` | text | | Banka adı |
| `sube_kodu` | text | | Şube kodu |
| `hesap_no` | text | | Hesap numarası |
| `iban` | text | | IBAN (biri yeterli) |
| `created_at` | timestamptz | ✓ | |
| `updated_at` | timestamptz | ✓ | |

> **Not:** `maas_net` bu tabloda **saklanmaz** — `maas_gecmisi` tablosundan alınır.

---

### `employment_periods`
Personel işe giriş ve çıkış dönemleri.

| Kolon | Tip | Zorunlu | Açıklama |
|-------|-----|---------|----------|
| `id` | uuid PK | ✓ | |
| `personel_id` | uuid FK | ✓ | `personel.id` |
| `sirket_id` | uuid FK | ✓ | `sirketler.id` |
| `baslangic_tarihi` | date | ✓ | İşe giriş tarihi |
| `bitis_tarihi` | date | | `NULL` = hâlâ çalışıyor |
| `ise_baslama_nedeni` | text | | |
| `ayrilma_nedeni` | text | | |
| `created_at` | timestamptz | ✓ | |

**Dönem filtresi:**
```sql
baslangic_tarihi <= donem_bitis
AND (bitis_tarihi >= donem_baslangic OR bitis_tarihi IS NULL)
```

---

### `maas_gecmisi`
Her maaş zammı yeni kayıt oluşturur. Önceki kayıt kapatılır.

| Kolon | Tip | Zorunlu | Açıklama |
|-------|-----|---------|----------|
| `id` | uuid PK | ✓ | |
| `personel_id` | uuid FK | ✓ | |
| `sirket_id` | uuid FK | ✓ | |
| `maas_net` | numeric(12,2) | ✓ | Net maaş (TL) |
| `gecerlilik_baslangic` | date | ✓ | Geçerlilik başlangıcı |
| `gecerlilik_bitis` | date | | `NULL` = güncel maaş |
| `aciklama` | text | | Zam notu |
| `created_at` | timestamptz | ✓ | |

> İlk kayıt personel eklenirken otomatik oluşturulur.

---

### `maas_bordro`
Aylık bordro veri girişi.

| Kolon | Tip | Zorunlu | Açıklama |
|-------|-----|---------|----------|
| `id` | uuid PK | ✓ | |
| `personel_id` | uuid FK | ✓ | |
| `sirket_id` | uuid FK | ✓ | |
| `donem_yil` | smallint | ✓ | |
| `donem_ay` | smallint | ✓ | 1–12 |
| `calisma_saati` | numeric(6,2) | ✓ | Dönem çalışma saati |
| `mesai_saati` | numeric(6,2) | ✓ | Mesai saati |
| `maas_net` | numeric(12,2) | ✓ | O dönemin net maaşı |
| `yol` | numeric(12,2) | ✓ | |
| `yemek` | numeric(12,2) | ✓ | |
| `prim` | numeric(12,2) | ✓ | |
| `tazminat` | numeric(12,2) | ✓ | |
| `senelik_izin` | numeric(12,2) | ✓ | |
| `banka` | numeric(12,2) | ✓ | Banka kesintisi |
| `bes` | numeric(12,2) | ✓ | BES kesintisi |
| `avans` | numeric(12,2) | ✓ | |
| `icra` | numeric(12,2) | ✓ | |
| `iceri_avans_kesinti` | numeric(12,2) | ✓ | |
| `ek_odemeler` | jsonb | ✓ | Maks. 4 kayıt |
| `ek_kesintiler` | jsonb | ✓ | Maks. 4 kayıt |
| `notlar` | jsonb | ✓ | Maks. 4 not |
| `toplam_odeme` | numeric(12,2) | ✓ | Hesaplanmış |
| `toplam_kesinti` | numeric(12,2) | ✓ | Hesaplanmış |
| `elden` | numeric(12,2) | ✓ | Hesaplanmış |

**Kısıtlama:** `UNIQUE(personel_id, donem_yil, donem_ay)`

---

### `banka_odeme`
Banka ödemesi bordrodan bağımsız kaydedilir.

| Kolon | Tip | Zorunlu | Açıklama |
|-------|-----|---------|----------|
| `id` | uuid PK | ✓ | |
| `bordro_id` | uuid FK | ✓ | `maas_bordro.id` |
| `personel_id` | uuid FK | ✓ | |
| `sirket_id` | uuid FK | ✓ | |
| `donem_yil` | smallint | ✓ | |
| `donem_ay` | smallint | ✓ | |
| `banka` | numeric(12,2) | ✓ | |
| `bes` | numeric(12,2) | ✓ | |
| `tazminat` | numeric(12,2) | ✓ | |
| `avans` | numeric(12,2) | ✓ | |
| `elden_banka` | numeric(12,2) | ✓ | `toplam - (banka+bes+tazminat+avans)` |

---

### `ayarlar`
Şirket bazlı sistem ayarları.

| Kolon | Tip | Zorunlu | Açıklama |
|-------|-----|---------|----------|
| `id` | uuid PK | ✓ | |
| `sirket_id` | uuid FK UNIQUE | ✓ | |
| `gunluk_calisma_saati` | numeric(4,2) | ✓ | Varsayılan: 8 |
| `aylik_calisma_saati` | numeric(6,2) | ✓ | Varsayılan: 225 |
| `resmi_tatiller` | jsonb | ✓ | `[{tarih, ad}]` formatı |
