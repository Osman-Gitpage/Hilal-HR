# Hilal HR — Güncellenmiş Evrak Şablon & Özlük Paketi Yol Haritası (update.md)

Bu doküman, kullanıcı isterlerine %100 birebir uyumlu olarak güncellenmiş teknik mimari ve uygulama planıdır.

---

## 📌 1. Personel Detay — Evrak Şablon Formu & Anında İndirme

**İş Akışı:**
1. Personel detay sayfasındaki Evrak sekmesinde tanımlı bir belge şablonuna (örn: **Görevlendirme Belgesi**, **KKD Zimmet Formu**) tıklandığında form modalı açılır.
2. Form alanları personelin sistem verileriyle (`ad`, `soyad`, `tc`, `gorev_unvan`, `ise_baslama_tarihi` vb.) **otomatik doldurulmuş (pre-fill)** olarak gelir.
3. Kullanıcı ihtiyaç halinde tarih, görev yeri veya özel alanları ekranda **manuel olarak düzenler**.
4. **"PDF İndir"** veya **"DOCX İndir"** butonuna tıklandığında doldurulmuş dosya anında tarayıcı üzerinden bilgisayara indirilir.
5. ⚠️ **Önemli:** Veritabanına veya evrak arşivine **kayıt yapılmaz**, yalnızca anlık dinamik belge üretilip indirilir.

---

## 📌 2. Tersane Özlük Paketi Sihirbazı (4 Adımlı Akış)

Özlük paketi hazırlama sihirbazı (`OzlukHazirlaWizard.tsx`) **4 aşamalı** hale getirilir:

* 📍 **Adım 1: Personel Seç** $\rightarrow$ Paket oluşturulacak personelin seçilmesi.
* 📍 **Adım 2: Eksik Evrak Kontrolü** $\rightarrow$ Zorunlu belgelerin tamlık durumu kontrolü.
* 📍 **Adım 3: Form Verileri Doldurma (YENİ SEKMELİ ADIM)** $\rightarrow$ 
  * Paket içerisindeki tüm dinamik evrakların (KKD, Görevlendirme, Tersane Özel Taahhütnamesi vb.) form alanları listelenir.
  * **⚡ "Hızlı Otomatik Doldur" Butonu:** Tek tıkla tüm form verilerini personelin sistem verileriyle doldurur. Kullanıcı gerekirse spesifik alanları manuel değiştirebilir.
* 📍 **Adım 4: Paket Oluştur ve İndir** $\rightarrow$ Doldurulan formlar ile sistemdeki PDF belgeleri birleştirilip ZIP olarak bilgisayara indirilir.

---

## 📌 3. Ayarlar — Özel Şablon Yükleme Alanı (`/ayarlar/sablonlar`)

* Kullanıcıların kendi özel `.docx` veya Form PDF şablonlarını yükleyebileceği, şablon değişkenlerini tanımlayabileceği ve yönetebileceği yönetim paneli.

---

## 📋 Görev ve Görev Planı (Task Plan)

### Task 1: Şablon Form Doldurucu & Anında İndirme Motoru
- `src/lib/templates/docx-template.ts` ve `pdf-form.ts` motorlarını anlık istemci indirmesi sağlayacak şekilde optimize etme.
- `PersonelEvrakFormDialog.tsx` bileşenini oluşturarak Personel Detay ekranına entegre etme.

### Task 2: Tersane Özlük Paketi Sihirbazını 4 Adıma Çıkarma
- `OzlukHazirlaWizard.tsx` bileşenine 3. Adım olarak "Form Verileri Doldurma" sekmesini ve "Hızlı Otomatik Doldur" butonunu ekleme.
- `useOzlukOlustur` ve backend action'larını özelleştirilmiş form verilerini kabul edecek şekilde güncelleme.

### Task 3: Ayarlar — Özel Şablon Yükleme Paneli
- `/ayarlar` altına Özel Şablon Yükleme ve Liste yönetim bileşenini ekleme.
