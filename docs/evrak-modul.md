# Evrak Yönetim Modülü

## Main Info

### Tablolar

**evrak_kategori** (Ayarlardan tanımlanır)
| Alan | Notlar |
|------|--------|
| id | |
| ad | örn: Adli Sicil, Sağlık Raporu, KKD, İmza |
| tip | personel / sirket / tersane_ozel |
| zorunlu | bool |
| sureli | bool |
| varsayilan_sure | süreliyse: 6 ay / 1 yıl / custom gün |
| sira | sıralama için |

**evrak**
| Alan | Notlar |
|------|--------|
| id | |
| kategori_id | FK → evrak_kategori |
| personel_id | FK → personel (null = şirket evrakı) |
| employment_period_id | FK → employment_periods |
| dosya_url | Backblaze B2 |
| dosya_adi | |
| versiyon | 1-3, max 3 saklanır |
| baslangic_tarihi | süreliyse |
| bitis_tarihi | süreliyse, oh veya manuel |
| durum | aktif / arsiv |
| onay_durumu | beklemede / onaylandi / reddedildi |
| yuklenme_tarihi | |

**evrak_log**
| Alan | Notlar |
|------|--------|
| id | |
| evrak_id | |
| islem | yuklendi / silindi / versiyon_silindi / onaylandi / reddedildi |
| kullanici | |
| tarih | |

**tersane_sablon**
| Alan | Notlar |
|------|--------|
| id | |
| ad | örn: "X Tersanesi Paketi" |
| standart_kategoriler | JSON, sıralama dahil |
| ozel_belgeler | JSON → tersane_ozel_belge referansları |

**tersane_ozel_belge**
| Alan | Notlar |
|------|--------|
| id | |
| tersane_sablon_id | FK |
| ad | örn: Fazla Mesai Formu, Muvafakatname |
| sablon_dosya_url | docx/pdf şablon |
| sira | |

### Hesaplamalar

```
// Geçerlilik durumu
Yeşil  → bitis_tarihi > bugün + 30 gün (veya süresiz)
Sarı   → bugün < bitis_tarihi <= bugün + 30 gün
Kırmızı → bitis_tarihi <= bugün VEYA evrak yok (zorunluysa)

// Versiyon limiti
Yeni versiyon yüklenince:
  versiyon sayısı > 3 ise en eski silinir → evrak_log'a kaydedilir

// Dönem geçişi
Yeni employment_period başlayınca:
  önceki dönemin evrakları durum = 'arsiv'
  yeni dönem için evrak alanları boş başlar
  "Arşivden Getir" → seçilen evrak yeni döneme kopyalanır (versiyon 1)
```

---

## Sayfa 1 — Evraklar (Ana Liste)

- KPI: Süresi yaklaşan evrak sayısı (toplam)
- Liste/Grid toggle
- Filtre: sadece eksik olanlar, sadece süresi yaklaşanlar
- Tablo: Ad Soyad | Kategori 1 | Kategori 2 | ... (her kategori bir kolon)
- Hücre renk: Yeşil / Sarı / Kırmızı
- Hücrede PDF thumbnail önizleme (ilk sayfa)
- Personele tıkla → detay sayfası
- Çoklu personel karşılaştırma (2-3 personel seç, yan yana karşılaştır)

---

## Sayfa 2 — Personel Evrak Detay

- Eksik evrak sayısı badge
- "Tersaneye Özlük Hazırla" butonu
- Kategori bazlı kartlar (ayarlardan tanımlı sırayla):
  - Thumbnail önizleme
  - Durum ikonu (✅/⚠️/❌)
  - Dosya adı, yüklenme/geçerlilik tarihi
  - Görüntüle / Değiştir / Sil
  - Versiyon geçmişi (max 3, geçmiş versiyonlara erişim)
- **Tabs:** Güncel Dönem / Arşiv
  - Arşiv: geçmiş employment_period'lara ait evraklar, salt okunur
  - "Arşivden Getir" → seçilen evrak yeni döneme kopyalanır

---

## Sayfa 3 — Tersane Şablonları (Özlük Paketleri)

- Şablon oluştur/düzenle
- Standart kategori sıralaması (sürükle-bırak)
- Tersaneye özel belgeler ekle (docx/pdf şablon yükle)
- Şablonla "Özlük Hazırla":
  1. Personel(ler) seç (toplu seçim destekli)
  2. Görevlendirme (docxtemplater ile otomatik dolar)
  3. KKD ve diğer form belgeleri (pdf-lib ile otomatik dolar, imza/kaşe eklenir)
  4. Tersaneye özel belgeler (otomatik dolar)
  5. Sistemde yüklü evraklar (Adli Sicil, Sağlık Raporu vb.)
  6. Hepsi sıraya göre birleştirilir (pdf-lib merge) → tek PDF
  7. Toplu seçimde → her personel için ayrı PDF, ZIP olarak indirilir
- Eksik evrak varsa özlük oluşturulamaz, uyarı listesi gösterilir

---

## Sayfa 4 — Şirket Evrakları

- Kategori: Vergi Levhası, İmza Sirküleri, Ticaret Sicil, **Kaşe** vb.
- Aynı versiyon/log sistemi

---

## Ayarlar — Evrak Kategorileri

- Yeni kategori ekle/düzenle
- Zorunlu mu işaretle
- Süreli/Süresiz işaretle
- Süreliyse: varsayılan süre (6 ay / 1 yıl / custom gün) — upload sırasında başlangıç+bitiş veya süre seçimiyle bitiş otomatik hesaplanır
- Sıralama (şablon ve normal görünüm için)

---

## Teknik Altyapı

### Dosya Depolama — Backblaze B2

- S3 uyumlu API → `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- Upload: presigned URL ile direkt client'tan B2'ye
- `evrak.dosya_url` → B2 object key saklanır, görüntülemede presigned URL üretilir

### Dosya Önizleme

| Format | Yöntem |
|--------|--------|
| PDF | `<iframe>` ile native tarayıcı önizleme veya `react-pdf` |
| DOCX | Google Docs Viewer: `https://docs.google.com/viewer?url={url}&embedded=true` |
| XLSX | Google Sheets Viewer (aynı yöntem) veya `SheetJS (xlsx)` ile tablo render |
| Resim (PNG/JPG) | Direkt `<img>` |

> PDF thumbnail (liste görünümünde ilk sayfa önizlemesi) için `react-pdf` veya `pdf.js` ile ilk sayfa canvas'a render edilip görsele çevrilir.

### Şablon Doldurma

**Word şablonları (Görevlendirme, tersaneye özel belgeler):**
- `docxtemplater` + `pizzip`
- Şablonda `{{ad}}`, `{{soyad}}`, `{{tarih}}` gibi değişkenler tanımlanır
- Personel/dönem verisi otomatik enjekte edilir
- Çıktı `.docx` → PDF'e çevrilir

**PDF form şablonları (KKD vb.):**
- `pdf-lib`
- PDF-XChange Editor ile önceden form alanları (AcroForm) eklenir
- `pdf-lib` ile `form.getTextField('alan_adi').setText(deger)`
- İmza/Kaşe → image olarak ilgili koordinata `drawImage` ile basılır
- Form flatten edilir (düzenlenemez hale getirilir)

### PDF Birleştirme (Özlük Paketi)

- `pdf-lib` ile merge:
  1. docxtemplater çıktısı (Görevlendirme) → PDF
  2. pdf-lib ile doldurulmuş formlar (KKD, tersaneye özel belgeler)
  3. Sistemde yüklü evraklar (Adli Sicil, Sağlık Raporu vb. — zaten PDF)
- Tüm sayfalar şablonda tanımlı sıraya göre tek PDF'e `copyPages` ile eklenir
- Toplu personel seçiminde her personel için bu işlem tekrarlanır, sonuçlar ZIP'lenir (`jszip`)

---

- Her evrak işlemi (yükleme, silme, versiyon silme, onay/red) `evrak_log`'a kaydedilir
- Kim, ne zaman, ne yaptı
- Özlük oluşturma işlemleri de loglanır (hangi personel, hangi tersane, ne zaman)
