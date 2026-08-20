# Hilal HR — Sistem Tanım Dokümanı (`system.md`)

Bu doküman, **Hilal HR** sisteminde yer alan tüm modülleri, sayfaları, özellikleri, veri varlıklarını ve işlevsel yetenekleri açıklamak amacıyla hazırlanmıştır.

---

## 1. Sistem Özeti

**Hilal HR**, çoklu şirket yapısını destekleyen; personel yönetimi, bordro, puantaj, evrak takibi, tersane özlük paketleri ve cari/fatura işlemlerini kapsayan kurumsal bir yönetim sistemidir.

### Sistemdeki Temel Yetenekler
- **Çoklu Şirket (Multi-Tenant) Yapısı:** Birden fazla şirketin aynı sistem üzerinden ayrı ayrı yönetilmesi.
- **Geçmiş Dönem ve Zam Takibi:** Personelin işe giriş/çıkış tarihçesi, zam geçmişi ve eski bordro versiyonlarının saklanması.
- **Otomatik Tersane Özlük Paketi:** Personel evraklarının tersane ve ana yüklenici şablonlarına göre otomatik hazırlanması ve toplu indirilmesi.
- **Versiyonlu ve Onaylı Bordro:** Bordroların taslak, onay ve kilitli aşamalarından geçmesi, revizyon geçmişinin saklanması.
- **Puantaj ve Zaman Takibi:** Günlük çalışma saatleri, özel durumlar, proje bazlı mesai dağılımları ve ay kapanışı.
- **Cari ve Fatura Takibi:** Fatura, proforma ve ödemelerin çoklu para birimi üzerinden takibi.

---

## 2. Sistemdeki Modüller ve Özellikler

### 2.1. Personel Yönetimi Modülü
* **Aktif Personel Listesi:** Çalışmakta olan tüm personellerin listesi ve özet bilgileri.
* **Arşiv (İşten Çıkanlar) Listesi:** İşten ayrılan personellerin ayrılma nedenleri ve tarihçeleri.
* **Hızlı Personel Ekleme:** Zorunlu temel bilgilerle (Ad, Soyad, TC, İşe Giriş Tarihi, Maaş, Banka/IBAN) hızlı kayıt.
* **Detaylı Personel Kaydı:** Kimlik, iletişim, adres, unvan, SGK sicil no ve banka hesap bilgilerini içeren tam kayıt formu.
* **Personel Detay Ekranı:**
  * **Genel Bilgiler:** Kişisel ve banka bilgileri.
  * **Çalışma Geçmişi:** İşe giriş ve işten çıkış dönemlerinin dökümü (`employment_periods`).
  * **Maaş Geçmişi:** Geçerlilik başlangıç/bitiş tarihleriyle maaş zam dökümü (`maas_gecmisi`).
  * **Puantaj Özeti:** Dönemlik çalışma ve mesai saatleri özeti.
  * **Evraklar:** Personele ait güncel ve arşivlenmiş tüm belgeler.

### 2.2. Puantaj (Zaman Takibi) Modülü
* **Genel Puantaj Matrisi:** Ayın 1-31 günleri boyunca tüm personellerin günlük çalışma saatlerinin takibi.
* **Giriş / Çıkış Saati Takibi:** Günlük giriş ve çıkış saatlerinin kaydedilmesi.
* **Özel Durum Kodu Tanımları:**
  * Yıllık İzin (`Yİ`)
  * Resmi Tatil (`RT`)
  * Raporlu (`RP`)
  * Çalışma Yok (`ÇY`)
  * Ücretsiz İzin (`Üİ`)
  * Pazar Mesaisi (`PM`)
  * İş Kazası (`İK`)
* **Proje Puantajı:** Günlük çalışma saatlerinin projelere göre paylaştırılması.
* **Proje Yönetimi Sayfası:** Aktif ve arşivdeki projelerin tanımı ve listesi.
* **Günlük Veri Giriş Modalı:** Gün bazlı saat, özel durum ve not girişi.
* **Ay Kapanış İşlemi:** İlgili ayın kapatılarak verilerin kilitlenmesi ve bordroya aktarılması.

### 2.3. Maaş & Bordro Yönetimi Modülü
* **Dönemlik Bordro Listesi:** Ay ve yıl bazında tüm personellerin bordro özetleri.
* **Bordro Veri Giriş Ekranı:**
  * **Ödemeler Tab'ı:** Çalışma saati, mesai saati, hak ediş, mesai bedeli, yol, yemek, prim, tazminat, senelik izin ücreti ve 4 adede kadar tanımlanabilir ek ödemeler.
  * **Kesintiler Tab'ı:** Banka, BES, avans, icra, içeri avans kesintisi ve 4 adede kadar tanımlanabilir ek kesintiler.
  * **İçeri Avans Takibi:** Geçen aydan devreden avans, verilen avans, kesilen avans ve devredilecek avans takibi.
  * **Notlar Tab'ı:** Yıllık izin gün sayısı ve bordro notları.
* **Bordro Revizyon Sistemi:** Onaylı bordrolarda değişiklik yapılması gerektiğinde eski versiyonun (v1) pasife çekilerek yeni versiyonun (v2) revizyon gerekçesiyle oluşturulması.
* **Revizyon Karşılaştırma Ekranı:** Versiyonlar arasındaki farkların incelenmesi.
* **Bordro Onay ve Kilitleme Süreci:**
  * Taslak
  * Kontrol Bekliyor
  * Onaylandı
  * Kilitlendi
* **Kilit Açma Denetimi:** Kilitli bordroların kilit açma yetkisi, kullanıcısı ve gerekçesi kaydı.
* **Banka Ödeme Yönetim Sayfası:** Banka ödemeleri, BES, tazminat, avans ve elden ödeme tutarlarının bağımsız yönetildiği ekran.

### 2.4. Evrak & Özlük Yönetim Modülü
* **Personel Evrakları Takibi:** Süreli ve süresiz belgelerin yüklenmesi, son 3 versiyonunun saklanması ve geçerlilik sürelerinin takibi (Geçerli, Süresi Yaklaşan, Süresi Dolan / Eksik).
* **Şirket Evrakları:** Vergi levhası, imza sirküleri, kaşe gibi şirket belgelerinin yönetimi.
* **Evrak Kategorileri Ayarları:** Belgelerin zorunlu mu, süreli mi olduğu ve varsayılan geçerlilik sürelerinin tanımı.
* **Tersane Şablonları (Özlük Paketi Üretimi):**
  * Tersane/ana yüklenici şablonlarının oluşturulması.
  * Personel görevlendirme belgeleri, KKD formları, muvafakatnameler ve sistemdeki kişisel evrakların (Adli Sicil, Sağlık Raporu vb.) belirli bir sırada otomatik doldurularak tek bir dosya halinde birleştirilmesi.
  * Toplu seçimlerde her personel için ayrı özlük paketi oluşturulup ZIP olarak indirilmesi.
* **Evrak İşlem Logları:** Evrak yükleme, silme, versiyon silme, onay ve red işlemlerinin geçmiş kaydı (`evrak_log`).

### 2.5. Cari & Belge Yönetim Modülü
* **Belge Yönetimi:** Fatura, Proforma ve Hesap Bilgisi kayıtları.
* **Çoklu Para Birimi & Kur:** TL, EUR, USD bazlı işlemler ve döviz kurları.
* **Parçalı Ödeme Takibi:** Belgeler için Banka, Elden veya Çek yöntemiyle parçalı ödeme kaydı ekleme.
* **Bakiye ve Gecikme Takibi:** Kalan bakiye takibi ve vadesi geçen belgeler için gecikme uyarıları.
* **Belge Ekleri:** Belgelerle ilgili dosya yükleme (PDF/Word).
* **Firma Yönetimi:** Cari firmaların kaydı, notları ve firma bazlı bakiye özetleri.

### 2.6. Sistem Ayarları ve Kullanıcı Yapısı
* **Çoklu Şirket Tanımları:** Şirket profili, vergi no, adres, iletişim ve logo bilgileri.
* **Kullanıcı Rolleri ve Yetkilendirme:** Şirket bazlı kullanıcı rolleri (`admin`, `editor`, `viewer`).
* **Çalışma Saati Ayarları:** Günlük varsayılan çalışma saati ve aylık çalışma saati.
* **Resmi Tatil Takvimi:** Şirkete özel resmi tatil günleri ve isimleri.

---

## 3. Sistemdeki Veri Varlıkları (Tablolar)

| Veri Varlığı | Açıklama |
|---|---|
| `sirketler` | Sistemdeki şirket profilleri |
| `kullanici_sirket` | Kullanıcıların şirket yetkileri ve rolleri |
| `personel` | Personel kimlik, unvan, iletişim ve banka bilgileri |
| `employment_periods` | Personel işe giriş ve işten çıkış dönemleri |
| `maas_gecmisi` | Personel maaş zam geçmişi |
| `maas_bordro` | Aylık bordro kayıtları ve versiyonları |
| `banka_odeme` | Banka ödeme sayfası verileri |
| `puantaj_genel` | Günlük puanaj girişleri ve özel durumlar |
| `puantaj_proje` | Proje bazlı günlük çalışma saatleri |
| `proje` | Şirket projeleri |
| `evrak_kategori` | Şirket ve personel evrak kategorileri |
| `evrak` | Yüklenen evraklar ve versiyonları |
| `evrak_log` | Evrak işlem geçmişi |
| `tersane_sablon` | Özlük paketi şablon tanımları |
| `tersane_ozel_belge` | Tersanelere özel şablon belgeler |
| `firma` | Cari firmalar |
| `belge` | Faturalar, proformalar ve hesap bilgileri |
| `belge_dosya` | Belgelere eklenen dosyalar |
| `odeme` | Belge ödeme kayıtları |
| `ayarlar` | Şirket bazlı sistem ayarları |

---

## 4. Sistemdeki Rapor ve Çıktı Çeşitleri

- **Maaş Bordrosu Çıktısı:** Aylık toplu bordro dökümü.
- **Ücret Hesap Pusulası:** Personel bazlı resmi hesap pusulası.
- **Yıllık Kumulatif Bordro:** 12 aylık kazanç dökümü.
- **Puantaj Çizelgesi:** Aylık matris puantaj dökümü.
- **Personel Özlük Detayı:** Personel kartı ve bilgileri.
- **Cari Ekstre / Belge Çıktısı:** Cari firma bakiye ve belge dökümü.
- **İzin Raporu:** Personel izin döküm formu.
- **Excel İçe / Dışa Aktarımları:** Bordro, puantaj, personel, cari ve banka listelerinin Excel aktarımı.

---
*Doküman Sonu.*
