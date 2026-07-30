# Cari Modülü

## Main Info

### Tablolar

**firma**
| Alan | Zorunlu | Notlar |
|------|---------|--------|
| id | * | uuid |
| ad | * | |
| notlar | | |

**belge** (Fatura / Proforma / Hesap Bilgisi)
| Alan | Zorunlu | Notlar |
|------|---------|--------|
| id | * | uuid |
| tur | * | fatura / proforma / hesap_bilgisi |
| belge_no | * | |
| tarih | * | |
| aciklama | * | |
| tutar | * | |
| para_birimi | * | TL / EUR / USD |
| kur | * | |
| firma_id | | FK → firma, opsiyonel |
| notlar | | belgeye özel |

**belge_dosya**
| Alan | Notlar |
|------|--------|
| id | |
| belge_id | FK → belge |
| dosya_url | Backblaze B2 |
| dosya_adi | |
| dosya_tipi | PDF / Word |

**odeme**
| Alan | Zorunlu | Notlar |
|------|---------|--------|
| id | * | |
| belge_id | * | FK → belge |
| tarih | * | |
| tutar | * | |
| para_birimi | * | |
| kur | * | |
| yontem | * | banka / elden / cek |
| aciklama | | |

### Hesaplamalar

```
// Kur karşılığı
odeme_tl_karsiligi = odeme.tutar * odeme.kur

// Bakiye
kalan = belge.tutar - SUM(odeme_tl_karsiligi)

// Ödeme durumu
Ödenmedi  → SUM(ödemeler) == 0
Kısmi     → 0 < SUM(ödemeler) < belge.tutar
Ödendi    → SUM(ödemeler) >= belge.tutar

// Gecikme
gecikme = bugun - belge.tarih > 30 gün AND durum != Ödendi
```

---

## Sayfa 1 — Belge Listesi

- KPI kartları: Toplam Alacak (TL/EUR/USD), Ödenen, Ödenmeyen, Gecikmiş
- Firma bazlı filtre
- Belge türü filtresi (Fatura / Proforma / Hesap Bilgisi)
- **Liste ve Izgara görünümü** (toggle)
- Tablo kolonları: Belge No, Tür, Tarih, Açıklama, Tutar, Kur, Kalan, Durum badge, İşlemler
- Durum badge: Ödenmedi (kırmızı) / Kısmi (turuncu) / Ödendi (yeşil)
- Gecikmiş → satır kırmızı vurgulu
- Toplu ödeme: birden fazla belge seç → toplu ödeme ekle

---

## Sayfa 2 — Belge Detay

**Üst kart:** Belge no, tür, tarih, tutar, para birimi, kur, firma, durum badge

**Tabs:**
1. **Ödemeler** — ödeme listesi + ödeme ekle butonu
2. **Dosyalar** — yüklü dosyalar (PDF/Word), birden fazla yükleme
3. **Notlar** — belgeye özel notlar

---

## Sayfa 3 — Belge Ekle / Düzenle

- Belge türü seçimi (Fatura / Proforma / Hesap Bilgisi)
- Belge no, tarih, açıklama
- Tutar, para birimi, kur (zorunlu)
- Firma seçimi (opsiyonel)
- Birden fazla dosya upload (PDF / Word)
- Notlar

---

## Sayfa 4 — Firma Listesi

- Firma ekle / düzenle
- Firma bazlı bakiye özeti (TL / EUR / USD)
- Firmaya tıklayınca o firmaya ait belgeler filtrelenir
