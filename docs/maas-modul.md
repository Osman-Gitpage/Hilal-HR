# Maaş Modülü

## Main Info

### Tablolar

**maas_gecmisi**
| Alan | Notlar |
|------|--------|
| id | |
| personel_id | FK → personel |
| maas_net | |
| gecerlilik_baslangic | |
| gecerlilik_bitis | null = güncel maaş |

> Personel eklendiğinde otomatik ilk kayıt oluşur. Zam geldiğinde eski kaydın bitişi güncellenir, yeni kayıt eklenir. Geçmiş bozulmaz.

**maas_bordro** (aylık veri)
| Alan | Notlar |
|------|--------|
| id | |
| personel_id | |
| donem (ay/yıl) | |
| calisma_saati | vg |
| mesai_saati | vg |
| yol | vg |
| yemek | vg |
| prim | vg |
| tazminat | vg |
| senelik_izin_ucreti | vg |
| ek_odemeler | JSON, max 4 (ad + tutar) |
| banka | vg |
| bes | vg |
| avans | vg |
| icra | vg |
| iceri_avans_kesinti | vg |
| ek_kesintiler | JSON, max 4 (ad + tutar) |
| iceri_avans_devir | oh (geçen aydan) |
| iceri_avans_verilen | vg |
| yillik_izin_gun | vg |
| notlar | JSON, max 4 |
| aciklama | |

**Hesaplamalar (oh)**
| Alan | Formül |
|------|--------|
| mesai_gunu | calisma_saati / günlük saat (ayarlardan, default: 8) |
| saat_ucreti | maas_net / aylık çalışma saati |
| hak_edis | calisma_saati * saat_ucreti |
| mesai_bedeli | mesai_saati * saat_ucreti (1x, çarpan yok) |
| toplam_odeme | hak_edis + mesai_bedeli + yol + yemek + prim + tazminat + senelik_izin_ucreti + ek_odemeler |
| toplam_kesinti | banka + bes + avans + icra + iceri_avans_kesinti + ek_kesintiler |
| elden | toplam_odeme - toplam_kesinti |
| iceri_avans_devredilecek | (devredilen + verilen) - kesinti |

> !! Çalışma saati ve mesai saati şimdilik manuel — puantaj modülü tamamlandığında otomatik gelecek.

---

## Sayfa 1 — Maaş Listesi

- Dönem + yıl seçimi
- KPI kartları
- Tablo: S.No, Ad Soyad, Çalışma S., Hak Ediş, Mesai S., Mesai B., Yol, Yemek, Prim, Diğer(+), Toplam, Banka, BES, Avans, Diğer(-), Kesinti, Elden, Eski Devir, Güncel Devir

---

## Sayfa 2 — Bordro Veri Girişi

- Üstte: dönem/yıl seçimi + personel seçimi (employment_periods'a göre filtreli)
- Özet kart (Toplam Ödeme, Toplam Kesinti, Elden) — tab altında sabit, kaydet butonu yanında

**Tab 1 — Ödemeler**
- Çalışma Saati (vg), Mesai Günü (oh), Hak Edişi (oh)
- Mesai Saati (vg), Mesai Bedeli (oh)
- Yol (vg), Yemek (vg)
- Prim, Tazminat, Senelik İzin Ücreti (vg)
- Ek Ödemeler: max 4 (ödeme adı + tutar, opsiyonel)

**Tab 2 — Kesintiler**
- Banka, BES, Avans, İcra, İçeri Avans Kesinti (vg)
- Ek Kesintiler: max 4 (kesinti adı + tutar, opsiyonel)
- İçeri Avans Takibi:
  - Devredilen → oh (geçen aydan otomatik)
  - Bu ay verilen → vg
  - Bu ay kesilen → otomatik (yukarıdan)
  - Devredilecek → oh

**Tab 3 — Not & Bilgi**
- Yıllık İzin (gün) → vg, yıl bazlı toplam personel detayda gösterilir
- Notlar: max 4
- Açıklama

---

## Sayfa 3 — Banka Ödeme Sayfası

> !! Bu sayfadaki veriler ayrı kaydedilir, maaş verilerini etkilemez !!

- Dönem + yıl seçimi
- KPI: Toplam Banka, Toplam Tazminat, Toplam Avans, Toplam Elden

**Tablo:** Ad Soyad, Banka, BES, Tazminat, Avans, Not, Elden

| Alan | Kaynak | Düzenlenebilir |
|------|--------|----------------|
| Banka | Maaş bordrosundan çeker | ✅ |
| BES | Maaş bordrosundan çeker | ❌ |
| Tazminat | Manuel | ✅ (sadece sayı) |
| Avans | Manuel | ✅ (sadece sayı) |
| Not | Manuel | ✅ (sadece yazı) |
| Elden | oh | ❌ |

**Elden (bu sayfaya özgü):**
```
Elden = (Maaş Toplam Ödeme) - (Banka + BES + Tazminat + Avans)
```

> Ad Soyad listesi employment_periods'a göre o döneme ait personeli gösterir. (Bkz. Genel Notlar)

---

# Geriye Dönük Bordro Revizyon Sistemi

## Amaç

Geçmiş dönem bordrosunu doğrudan değiştirmek yerine versiyon mantığı ile revizyon yapmak.

Eski veri korunur, yeni veri ayrı kayıt olarak oluşturulur. Böylece geçmiş kayıt bozulmaz ve tüm değişiklikler izlenebilir olur.

---

## Mantık

### Yanlış Yöntem

Ocak bordrosunu aç → rakamı değiştir → kaydet

Bu yöntem geçmiş veriyi bozar ve denetim açısından risklidir.

---

### Doğru Yöntem

Ocak bordrosu v1 korunur

Yeni kayıt oluşturulur:

Ocak bordrosu v2

Eski kayıt pasif hale gelir, yeni kayıt aktif versiyon olur.

---

## maas_bordro Tablosuna Eklenecek Alanlar

| Alan | Açıklama |
|---|---|
| version_no | Versiyon numarası |
| parent_bordro_id | İlk bordroya referans |
| revision_reason | Revizyon nedeni |
| revised_by | Revizyon yapan kullanıcı |
| revised_at | Revizyon tarihi |
| is_active_version | Aktif kullanılan versiyon bilgisi |

---

## Revizyon Süreci

### 1. Revizyon Başlat

Sadece yetkili kullanıcı “Revizyon Başlat” butonunu kullanabilir.

Revizyon nedeni zorunlu girilir.

---

### 2. Sistem Yeni Versiyon Oluşturur

Mevcut bordro birebir kopyalanır.

Yeni kayıt:

- yeni version_no ile oluşturulur
- taslak durumunda açılır

Eski kayıt salt okunur olarak korunur.

---

### 3. Düzenleme

Sadece yeni versiyon düzenlenebilir.

Eski bordro değiştirilemez.

---

### 4. Tekrar Onay Süreci

Yeni versiyon yeniden maaş onay sürecine girer.

Onay sonrası aktif versiyon olarak kullanılmaya başlanır.

---

## Örnek

| Personel | Dönem | Versiyon |
|---|---|---|
| Ahmet Yılmaz | Ocak 2026 | v1 |
| Ahmet Yılmaz | Ocak 2026 | v2 |

v1 pasif kayıt olarak saklanır

v2 aktif bordro olarak kullanılır

---

## Revizyon Sebepleri

- Eksik mesai girilmiş
- Yanlış avans kesilmiş
- Eksik prim eklenmiş
- Banka tutarı yanlış girilmiş
- Tazminat düzeltmesi yapılmış
- Senelik izin ücreti revize edilmiş
- Yönetim kararı ile düzeltme yapılmış

---

## Ek Özellik

### Revizyon Karşılaştırma Ekranı

Eski ve yeni versiyon farkları gösterilir.

Örnek:

- Mesai Saati: 12 → 18
- Prim: 0 → 5.000
- Avans: 3.000 → 1.500

Bu ekran denetim ve kontrol açısından oldukça güçlü olur.

---

# Bordro Kilitleme Sistemi

## Amaç

Geçmiş dönem bordrolarının sonradan yanlışlıkla değiştirilmesini engellemek.

Bu sistem manuel çalışır ve sadece yetkili kullanıcı tarafından dönem kapatılır.

---

## Kilitleme Mantığı

Dönem bordrosu tamamlandıktan sonra yetkili kullanıcı:

“Dönemi Kilitle”

butonu ile ilgili ayı kapatır.

Örnek:

Ocak 2026 bordrosu tamamlandıktan sonra manuel olarak kilitlenir.

---

## Kilitli Bordroda

- Veri girişi kapalı olur
- Güncelleme yapılamaz
- Silme işlemi yapılamaz
- Toplu işlem kapatılır
- Banka ödeme verileri sadece görüntülenebilir
- PDF ve Excel çıktısı alınabilir
- Log kayıtları görüntülenebilir

---

## Kilit Açma Yetkisi

Sadece aşağıdaki kullanıcılar kilit açabilir:

- Sistem Yöneticisi
- Finans Müdürü
- Muhasebe Sorumlusu

---

## Kilit Açılırsa

Aşağıdaki bilgiler zorunlu olarak kayıt altına alınır:

- Kilidi açan kullanıcı
- Tarih ve saat
- Açılma nedeni

Sistem revizyon moduna geçer.

İşlem tamamlandıktan sonra tekrar manuel kilitleme yapılır.

---

# Maaş Onay Süreci

## Amaç

Bordro verisinin kontrol edilmeden kesinleşmesini engellemek, yetkili onayı sonrası maaşı finalize etmek ve izinsiz değişiklikleri önlemek.

---

## Bordro Durumları

### 1. Taslak

Bordro ilk oluşturulduğunda durum Taslak olur.

Bu aşamada:

- tüm alanlar düzenlenebilir
- veri girişi serbesttir
- hesaplamalar canlı çalışır
- kullanıcı kayıt yapabilir

Ancak bu kayıt henüz resmi bordro değildir.

---

### 2. Kontrol Bekliyor

Veri girişi tamamlandıktan sonra kullanıcı:

“Onaya Gönder”

işlemini yapar.

Durum:

Kontrol Bekliyor

Bu aşamada:

- veri giriş personeli düzenleme yapamaz
- sadece yetkili kullanıcı inceleme yapabilir

---

### 3. Onaylandı

Muhasebe veya yönetici kontrolü sonrası:

“Onayla”

işlemi yapılır.

Durum:

Onaylandı

Bu aşamada:

- bordro resmi hale gelir
- maaş listesi KPI verileri bu kayıt üzerinden çalışır
- banka ödeme ekranı bu veriyi baz alır

---

### 4. Kilitlendi

Dönem kapanışı sonrası bordro manuel olarak kilitlenir.

Durum:

Kilitlendi

Bu aşamada artık bordro üzerinde değişiklik yapılamaz.

Sadece revizyon başlatılabilir.

---

## Yetkiler

### Veri Giriş Personeli

- Taslak oluşturabilir
- Veri girişi yapabilir
- Onaya gönderebilir

---

### Muhasebe Yetkilisi

- Kontrol yapabilir
- Onay verebilir
- Revizyon başlatabilir

---

### Yönetici / Finans Müdürü

- Nihai kontrol sağlar
- Kilitleme işlemi yapabilir
- Kilit açabilir

---