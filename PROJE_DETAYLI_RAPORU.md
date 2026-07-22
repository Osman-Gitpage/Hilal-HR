# Hilal HR (Muhasebe, Personel, Bordro ve Evrak Yönetim Sistemi) — Kapsamlı Proje Raporu

Bu rapor, **Hilal HR** projesinin mimarisini, kullanılan teknolojileri, veritabanı yapısını, modüler işlevlerini, hesaplama algoritmalarını ve sistem standartlarını detaylı bir şekilde açıklamak amacıyla hazırlanmıştır. *(Görsel/tasarım öğeleri hariç tutulmuş, teknik ve işlevsel detaylara odaklanılmıştır.)*

---

## 1. Genel Proje Tanımı ve Amacı

**Hilal HR**, özellikle karmaşık operasyonel süreçlere (tersaneler, şantiyeler, çoklu projeler ve personel sirkülasyonunun yüksek olduğu sektörler) sahip işletmeler için tasarlanmış enterprise düzeyde bir **İnsan Kaynakları, Bordro, Puantaj, Evrak Yönetimi ve Cari/Fatura Takip Sistemidir**.

### Temel Hedefler
- **Çoklu Şirket (Multi-Tenant) Yapısı:** Tek bir altyapı üzerinde birden fazla şirketin izole bir şekilde yönetilmesi.
- **Tarihsel Geçmişin Korunması:** Personel işe giriş/çıkış dönemleri, maaş zamları ve geçmiş bordroların versiyonlanarak asla ezilmeden/bozulmadan saklanması.
- **Otomatik Özlük Paketi Hazırlama:** Tersaneler ve ana yükleniciler için gerekli olan personel özlük evraklarının (DOCX şablon doldurma, PDF form tamamlama, kaşe/imza ekleme ve PDF birleştirme) saniyeler içinde otomatik üretilmesi.
- **Esnek Bordro ve Avans Takibi:** Değişen ek ödemeler, ek kesintiler, icra ve "içeri avans" devirlerinin hatasız hesaplanması.
- **Hassas Puantaj:** Günlük çalışma saatleri, özel durumlar (rapor, izin, resmi tatil, pazar mesaisi) ve projeler bazında mesai ayrıştırması.

---

## 2. Teknoloji Yığını (Tech Stack) & Mimari

Sistem, modern web standartlarına uygun, yüksek performanslı ve ölçeklenebilir bir mimari ile inşa edilmiştir.

### Core Framework & Dil
- **Next.js 16 (App Router):** Server Components (RSC) ve Client Components mimarisi ile yüksek SEO, hızlı yükleme ve performans.
- **React 19:** En güncel React UI kütüphanesi.
- **TypeScript 5:** Tüm veri modellerinde strict tip güvenliği (Type-safety).

### Kullanıcı Arayüzü & Stil Altyapısı
- **Tailwind CSS v4:** Modern ve esnek stil sistemi.
- **shadcn/ui & Base UI:** Erişilebilir, yeniden kullanılabilir UI bileşenleri.
- **Lucide Icons:** Vektörel ikon kütüphanesi.
- **Sonner:** Toast bildirim sistemi.
- **Next Themes:** Tema (karanlık/aydınlık mod) desteği.

### Veri Yönetimi & State Mimarisi
- **TanStack Query v5 (React Query):** Sunucu verilerinin (Server State) çekilmesi, önbelleklenmesi (caching) ve otomatik güncellenmesi (invalidation).
- **Zustand v5:** İstemci tarafı (UI State) yönetimi. Aktif şirket seçimi, seçili dönem, filtreler ve modal durumları Zustand mağazalarında saklanır.

### Backend & Veritabanı (BaaS)
- **Supabase (PostgreSQL):** İlişkisel veritabanı yönetimi.
- **Row Level Security (RLS):** Şirket verilerinin kullanıcı rolleri bazında tamamen izole edilmesini sağlayan veritabanı seviyesinde güvenlik.
- **@supabase/ssr:** SSR ve Server Action'lar üzerinde güvenli oturum ve çerez (cookie) yönetimi.

### Bulut Depolama & Dosya Yönetimi
- **Backblaze B2 Object Storage:** Evrak ve dosya depolama.
- **AWS S3 SDK (`@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`):** Backblaze B2 ile S3 uyumlu iletişim. Dosyalar presigned URL'ler ile istemciye güvenli şekilde sunulur.

### Doküman, PDF ve Raporlama Kütüphaneleri
- **`pdf-lib` & `@pdf-lib/fontkit`:** PDF şablon doldurma (AcroForms), sayfa birleştirme (merge), metin ve görsel/kaşe/imza basma.
- **`docxtemplater` & `pizzip`:** `.docx` formatındaki Word şablonlarına personel verilerini dinamik olarak basma.
- **`docx-preview`:** Word belgelerinin tarayıcıda önizlenmesi.
- **`react-pdf`:** PDF evraklarının istemci tarafında sayfalanarak görüntülenmesi ve thumbnail üretimi.
- **`JSZip` (`jszip`) & `file-saver`:** Toplu personel özlük paketlerinin ZIP olarak paketlenip indirilmesi.
- **`jspdf` & `jspdf-autotable`:** İstemci tarafında rapor ve bordro PDF'i üretimi.
- **`SheetJS` (`xlsx`):** Excel verilerinin dışa aktarımı ve içe aktarımı.

---

## 3. Veritabanı Şeması ve Veri Modeli

Sistem ilişkisel veritabanı tasarım kurallarına tam uyumlu olarak tasarlanmıştır.

```
                  ┌─────────────────┐
                  │    sirketler    │
                  └────────┬────────┘
                           │ 1:N
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────┴──────┐   ┌───────┴──────┐   ┌───────┴────────┐
│  personel    │   │   ayarlar    │   │  kullanici_    │
└───────┬──────┘   └──────────────┘   │    sirket      │
        │ 1:N                         └────────────────┘
 ┌──────┴───────────────────────────────────────────────────────┐
 │                                                              │
 ├─► employment_periods (İşe Giriş/Çıkış Dönemleri)             │
 ├─► maas_gecmisi       (Geçerlilik Tarihli Maaş Zam Geçmişi)   │
 ├─► maas_bordro        (Aylık Bordro Verileri & Versiyonlar)   │
 ├─► puantaj_genel      (Günlük Giriş/Çıkış & Özel Durumlar)     │
 ├─► puantaj_proje      (Proje Bazlı Mesai Saatleri)            │
 └─► evrak              (Personel Dosyaları & Versiyonlar)      │
```

### Ana Tablolar ve İşlevleri

1. **`sirketler` & `kullanici_sirket`**
   - Şirket profilleri ve kullanıcı yetkilendirme tablosudur.
   - Roller: `admin`, `editor`, `viewer`.
   - `UNIQUE(kullanici_id, sirket_id)` kısıtlaması ile çoklu şirket erişimi yönetilir.

2. **`personel`**
   - Çalışanların kimlik, iletişim, unvan ve banka bilgilerini (IBAN / Şube-Hesap No) tutar.
   - *Not:* `maas_net` bu tabloda tutulmaz; zam geçmişi için `maas_gecmisi` kullanılır.

3. **`employment_periods`**
   - Çalışanın giriş ve çıkış tarihlerini tutar (`bitis_tarihi IS NULL` ise aktif çalışandır).
   - Tüm puantaj, bordro ve evrak sorguları bu tablo üzerinden ilgili döneme göre filtrelenir.

4. **`maas_gecmisi`**
   - Maaş artışlarının tarihsel dökümü. Her zam geldiğinde yeni bir kayıt oluşturulur, eski kaydın `gecerlilik_bitis` tarihi kapatılır.

5. **`maas_bordro` & `banka_odeme`**
   - `maas_bordro`: Personelin ilgili ay ve yıldaki çalışma saati, mesai saati, hak edişi, ek ödemeleri, ek kesintileri, avansları ve elden ödemelerini tutar.
   - `version_no`, `parent_bordro_id`, `is_active_version`, `revision_reason` alanları ile geriye dönük versiyonlu bordro revizyonunu destekler.
   - `banka_odeme`: Bordro verilerinden türetilen ancak muhasebenin bankadan ödeyeceği tutarları bağımsız yönetebildiği tablo.

6. **`puantaj_genel` & `puantaj_proje` & `proje`**
   - `puantaj_genel`: Personel bazlı günlük çalışma/giriş-çıkış saati veya özel durum kodları.
   - `puantaj_proje`: Günlük çalışma saatlerinin hangi projede harcandığını takip eder.

7. **`evrak_kategori`, `evrak`, `evrak_log`**
   - Şirket veya personel bazlı evrakların saklandığı yer.
   - Süreli evraklar için geçerlilik bitiş takibi. Max 3 versiyona kadar dosya geçmişi saklama. Tüm işlemler `evrak_log` tablosunda denetlenir.

8. **`tersane_sablon` & `tersane_ozel_belge`**
   - Tersane veya ana yüklenicilere sunulacak özlük dosyalarının şablon tanımları.

9. **`firma`, `belge`, `belge_dosya`, `odeme`**
   - Cari hesaplar, faturalar/proformalar (TL, EUR, USD) ve bunlara ait parçalı ödemeler ile dosya ekleri.

10. **`ayarlar`**
    - Şirket bazlı günlük çalışma saati (varsayılan: 8), aylık çalışma saati (varsayılan: 225) ve resmi tatil takvimi.

---

## 4. Modüller ve İşlevsel Detaylar

### A. Personel Yönetimi Modülü
- **Aktif / Arşiv Ayrımı:** `employment_periods` tablosuna göre çalışanlar ve işten ayrılanlar filtrelenir.
- **Hızlı Personel Ekleme:** Sadece zorunlu alanlar (Ad, Soyad, TC, İşe Giriş Tarihi, Maaş Net, Banka/IBAN) ile hızlı kayıt.
- **Detaylı Personel Profili:** Kişisel bilgiler, çalışma geçmişi, maaş zam geçmişi, puantaj özeti ve yüklü evraklar sekmeler halinde sunulur.

### B. Maaş & Bordro Yönetimi Modülü
- **Canlı Bordro Hakediş Hesabı:** Personelin net maaşı, çalışma saatleri ve mesai saatlerinden dinamik hak ediş hesaplama.
- **Esnek Ek Kalemler:** Max 4 adet dinamik ek ödeme (prim, ikramiye vb.) ve max 4 adet ek kesinti (avans, icra vb.) tanımlama.
- **İçeri Avans Takibi:** Geçen aydan devreden avans, bu ay verilen avans ve kesilen avans üzerinden devredilecek tutarın otomatik takibi.
- **Geriye Dönük Versiyonlu Revizyon Sistemi:**
  - Geçmiş dönem bordrosu doğrudan değiştirilmez.
  - "Revizyon Başlat" ile eski versiyon (örn. v1) pasiflenip salt okunur saklanır; yeni versiyon (v2) taslak olarak kopyalanır. Değişiklikler v2 üzerinde yapılıp onaya sunulur.
- **Bordro Kilitleme & Onay Süreci:**
  - **Taslak** $\rightarrow$ **Kontrol Bekliyor** $\rightarrow$ **Onaylandı** $\rightarrow$ **Kilitlendi** aşamaları.
  - Kilitlenen döneme veri girişi yapılamaz, sadece yetkili kullanıcı gerekçe belirterek kilit açabilir.
- **Banka Ödeme Sayfası:** Banka ve BES kesintilerinin bordrodan çekildiği, avans ve tazminatın elden ödemeyi nasıl etkilediğinin görüldüğü ayrı yönetim paneli.

### C. Puantaj (Zaman Takibi) Modülü
- **Matris Görünümü:** Personel x Ayın Günleri (1-31) matrisi.
- **Özel Durum Kodları:**
  - `Yİ` (Yıllık İzin - 8s)
  - `RT` (Resmi Tatil - 8s)
  - `RP` (Raporlu - 8s)
  - `ÇY` (Çalışma Yok - 8s)
  - `Üİ` (Ücretsiz İzin - 0s)
  - `PM` (Pazar Mesaisi - 16s mesai)
  - `İK` (İş Kazası - 8s)
- **Proje Puantajı:** Harcanan saatlerin projelere göre dağıtılması.
- **Ay Kapanışı:** Ay kapatıldığında `kapali = true` yapılır ve veriler kilitlenerek bordroya aktarılır.

### D. Evrak & Özlük Yönetimi Modülü
- **Süreli Evrak Uyarı Sistemi:**
  - 🟢 **Yeşil:** Geçerliliğin bitmesine 30 günden fazla var.
  - 🟡 **Sarı:** Geçerliliğin bitmesine 30 günden az kaldı.
  - 🔴 **Kırmızı:** Süresi dolmuş veya zorunlu evrak eksik.
- **Versiyon Kontrolü:** Yüklenen evrakların son 3 versiyonu saklanır, eskiler otomatik arşivlenir.
- **Otomatik Tersane Özlük Paketi Üretimi:**
  1. Seçilen personeller için tanımlı şablon çağrılır.
  2. Word görevlendirme belgeleri (`docxtemplater`) doldurulur.
  3. PDF form belgeleri (KKD vb. `pdf-lib` ile) doldurulup kaşe/imza görseli basılır ve dondurulur (flatten).
  4. Personelin sistemdeki aktif PDF evrakları (Adli Sicil, Sağlık Raporu) çekilir.
  5. Tüm dokümanlar sıralı şekilde tek bir PDF dosyasında birleştirilir (`copyPages`).
  6. Toplu seçimlerde her personel için ayrı PDF oluşturulup tek tıkla ZIP olarak indirilir.

### E. Cari & Belge Yönetim Modülü
- **Çoklu Para Birimi:** TL, EUR, USD fatura ve proforma takibi.
- **Bakiye & Gecikme Takibi:** Parçalı ödemelerin düşülmesi ile kalan bakiye hesaplama; 30 günü geçen ödenmemiş belgelerde gecikme uyarısı.
- **Liste & Izgara (Grid) Görünümü:** Belge ve firmaların esnek listelenmesi.

---

## 5. Hesaplama Algoritmaları ve Formüller

Sistem genelinde kullanılan temel matematiksel formüller aşağıda tanımlanmıştır:

$$\text{Saatlik Ücret} = \frac{\text{maas\_net}}{\text{aylik\_calisma\_saati}}$$

$$\text{Hak Ediş} = \text{calisma\_saati} \times \text{Saatlik Ücret}$$

$$\text{Mesai Bedeli} = \text{mesai\_saati} \times \text{Saatlik Ücret} \quad (1\times \text{ çarpan})$$

$$\text{Toplam Ödeme} = \text{Hak Ediş} + \text{Mesai Bedeli} + \text{Yol} + \text{Yemek} + \text{Prim} + \text{Tazminat} + \text{Senelik İzin} + \sum \text{Ek Ödemeler}$$

$$\text{Toplam Kesinti} = \text{Banka} + \text{BES} + \text{Avans} + \text{İcra} + \text{İçeri Avans Kesinti} + \sum \text{Ek Kesintiler}$$

$$\text{Elden Ödeme (Bordro)} = \text{Toplam Ödeme} - \text{Toplam Kesinti}$$

$$\text{Elden Ödeme (Banka Ekranı)} = \text{Toplam Ödeme} - (\text{Banka} + \text{BES} + \text{Tazminat} + \text{Avans})$$

$$\text{Devredilecek İçeri Avans} = (\text{Devredilen Avans} + \text{Verilen Avans}) - \text{Kesilen Avans}$$

---

## 6. Güvenlik, Performans ve Mimari Standartlar

1. **Veri İzolasyonu (RLS):** Supabase PostgreSQL üzerinde tanımlı Row Level Security politikaları sayesinde, her istek kullanıcının bağlı olduğu `sirket_id` kısıtı altında çalışır. Kullanıcılar başka şirketlerin verilerine erişemez.
2. **State Ayrımı (Clean Architecture):**
   - Sunucu verileri hiçbir zaman Zustand içinde tutulmaz; TanStack Query ile yönetilir.
   - Zustand sadece geçici UI durumlarını (seçili modal, aktif sekme, filtreler) tutar.
   - Karmaşık form yönetimleri için `useReducer` ve özel hook yapısı (`useBordroForm`) kullanılır.
3. **Audit Log & Şeffaflık:**
   - Evrak işlemleri (`evrak_log`), bordro revizyonları (`revision_reason`, `revised_by`) ve kilit açma işlemleri kimin tarafından ne zaman yapıldığı bilgisiyle eksiksiz kayıt altına alınır.
4. **Güvenli Dosya Depolama:**
   - Backblaze B2 kovaları (bucket) dış dünyaya kapalıdır.
   - Dosya görüntüleme ve indirme işlemleri yalnızca kısa süreli geçerli Presigned URL'ler ile yapılır.

---
*Rapor Sonu.*
