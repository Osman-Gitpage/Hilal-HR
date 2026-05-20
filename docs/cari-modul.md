# Cari / Fatura Modülü

## Main Info

### Tablolar

**gemi**
| Alan | Zorunlu | Notlar |
|------|---------|--------|
| id | * | uuid |
| ad | * | |
| imo_no | | opsiyonel |
| sirket_id | * | FK → sirket |
| notlar | | |

**sirket**
| Alan | Notlar |
|------|--------|
| id | |
| ad | |
| notlar | |

**ilgili_kisi**
| Alan | Notlar |
|------|--------|
| id | |
| gemi_id | FK → gemi |
| ad | |
| iletisim | opsiyonel |

**belge** (Proforma / Fatura)
| Alan | Notlar |
|------|--------|
| id | |
| gemi_id | FK → gemi |
| tur | proforma / fatura |
| belge_no | PTS AWB no veya Fatura no |
| tarih | |
| ilgili_kisi_id | null → proformada yok |
| kalemler | JSON (açıklama, miktar, birim, birim_fiyat, iskonto) |
| toplam | oh |
| iskonto | |
| genel_toplam | oh |
| para_birimi | TL / EUR / USD |
| kdv_orani | opsiyonel |
| notlar | |
| pdf_url | Supabase Storage |

**odeme**
| Alan | Notlar |
|------|--------|
| id | |
| belge_id | FK → belge |
| tarih | |
| tutar | |
| para_birimi | |
| yontem | banka / elden |
| dekont_url | Supabase Storage |
| not | |

### Hesaplamalar

```
belge.toplam = SUM(kalem.miktar * kalem.birim_fiyat)
belge.genel_toplam = toplam - iskonto

odeme_durumu:
  - Ödenmedi: SUM(odeme.tutar) == 0
  - Kısmi: 0 < SUM(odeme.tutar) < genel_toplam
  - Ödendi: SUM(odeme.tutar) >= genel_toplam

kalan = genel_toplam - SUM(odeme.tutar)
```

---

## Sayfa 1 — Gemi Listesi

- KPI: Toplam Alacak (TL / EUR / USD ayrı), Ödenen, Ödenmeyen
- Gemi listesi: ad, şirket, toplam alacak, durum
- Gemi ekle butonu

---

## Sayfa 2 — Gemi Detay

**Üst kart:** Gemi adı, IMO, şirket, ilgili kişiler

**Tabs:**
1. Proformalar
2. Faturalar
3. Ödemeler
4. Notlar

Her belge satırında: belge no, tarih, tutar, para birimi, durum (Ödenmedi / Kısmi / Ödendi), kalan

Ödeme detayı:
```
Proforma 202614 | 750.000 TL | KISMİ
  └── Ödeme 1: 300.000 TL | 15.04 | Banka | [Dekont]
  └── Kalan: 450.000 TL
```

---

## Sayfa 3 — Cari Genel

- Tüm gemilerin özet tablosu
- Para birimi bazlı filtre (TL / EUR / USD)
- Kolonlar: Gemi, Şirket, Belge No, Açıklama, Borç, Kur, Durum, Ödenme Tarihi, Bakiye

---

## Sayfa 4 — Belge Ekle / Düzenle

- Belge türü seçimi (Proforma / Fatura)
- Gemi seçimi
- İlgili kişi seçimi (sadece Proforma'da yok, Fatura'da opsiyonel)
- Kalem kalem giriş (açıklama, miktar, birim, birim fiyat, iskonto)
- Toplam / İskonto / Genel Toplam (oh)
- Para birimi seçimi
- PDF upload (alternatif olarak)
- Notlar

---

## Sayfa 5 — Firma Bazlı Görünüm

- Firma seçimi
- O firmaya ait tüm gemiler
- Firma bazlı bakiye (TL / EUR / USD ayrı)
- Belge ve ödeme özeti
