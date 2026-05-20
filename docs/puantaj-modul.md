# Puantaj Modülü

## Main Info

### Tablolar

**puantaj_genel**
| Alan | Notlar |
|------|--------|
| id | |
| personel_id | FK → personel |
| tarih | ISO 8601 |
| giris_saati | null if özel durum |
| cikis_saati | null if özel durum |
| calisma_saati | oh: cikis - giris |
| ozel_durum | null if giriş/çıkış |
| aciklama | opsiyonel |
| kapali | ay kapanışında true |

> Giriş/çıkış veya özel durum — ikisi aynı anda olmaz.

**puantaj_proje**
| Alan | Notlar |
|------|--------|
| id | |
| personel_id | FK → personel |
| proje_id | FK → proje |
| tarih | ISO 8601 |
| saat | o gün o projeye girilen saat |

**proje**
| Alan | Notlar |
|------|--------|
| id | |
| ad | |
| baslangic_tarihi | |
| bitis_tarihi | null = aktif |
| durum | aktif / arsiv |
| aciklama | opsiyonel |

### Hesaplama Algoritması

```
// Günlük toplam saat
gunluk_toplam = puantaj_genel.calisma_saati + SUM(puantaj_proje.saat) // aynı tarih

// Boş hücre = 0 saat (maaş hesabını etkiler)

// Aylık toplam
aylik_toplam = SUM(gunluk_toplam) // tüm ay

// Toplam mesai
toplam_mesai = SUM(puantaj_proje.saat) // proje saatleri mesai sayılır
             + ozel_durum == 'PM' ? 16 : 0
```

### Özel Durum Saatleri

| Durum | Kod | Saat | Renk |
|-------|-----|------|------|
| Yıllık İzin | Yİ | 8 | Mavi |
| Resmi Tatil | RT | 8 | Mor |
| Raporlu | RP | 8 | Yeşil |
| Çalışma Yok | ÇY | 8 | Gri |
| Ücretsiz İzin | Üİ | 0 | Turuncu |
| Pazar Mesaisi | PM | 16 mesai | Pembe |
| İş Kazası | İK | 8 | Kırmızı |

### Personel Listeleme Algoritması

```
// O ay gösterilecek personel:
employment_periods.baslangic <= ayın sonu
AND (employment_periods.bitis >= ayın başı OR bitis IS NULL)

// Çıkış tarihi ay içindeyse:
- 1 → çıkış günü: girilebilir
- çıkış günü+1 → ay sonu: kilitli

// Geçmiş aylar etkilenmez (ay kapanışı korur)
```

### Ay Kapanışı

- Kapanış yapılınca o aya ait tüm kayıtlar `kapali = true`
- Kapalı aya hiçbir düzenleme yapılamaz
- Maaş modülü kapalı ayın verisini kullanır

---

## Sayfa 1 — Genel Puantaj

- Dönem + yıl seçimi
- Tablo: Personel | 1-31 | Toplam (oh) | Toplam Mesai (oh) | Maaş Saat (manuel) | SGK Gün (manuel)
- Gün başlıklarında: gün adı kısaltma + tarih
- Pazarlar farklı renk header
- Hücre: çalışma saati → sayı, özel durum → kısaltma + renk badge
- Not girilmişse → sarı nokta (köşede)
- Hücreye tıklayınca modal açılır
- Ay kapanış butonu

**Modal — Gün Veri Girişi**
- Ya: Giriş saati + Çıkış saati → çalışma saati oh
- Ya: Özel durum seçimi
- Açıklama/not alanı (opsiyonel)

---

## Sayfa 2 — Proje Puantaj

- Dönem + proje seçimi
- Aynı tablo yapısı: Personel | 1-31 | Toplam (oh)
- Hücrede o gün o projeye girilen saat
- Hücreye tıklayınca modal: saat girişi + açıklama
- Bir personel aynı günde birden fazla projeye saat girebilir

---

## Sayfa 3 — Projeler

- Proje listesi (aktif / arşiv tabs)
- Proje ekle / düzenle / arşive al
- Proje detay sayfası → sonraya bırakıldı
