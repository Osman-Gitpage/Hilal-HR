export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ayarlar: {
        Row: {
          aylik_calisma_saati: number
          created_at: string
          gunluk_calisma_saati: number
          id: string
          resmi_tatiller: Json
          sirket_id: string
          updated_at: string
        }
        Insert: {
          aylik_calisma_saati?: number
          created_at?: string
          gunluk_calisma_saati?: number
          id?: string
          resmi_tatiller?: Json
          sirket_id: string
          updated_at?: string
        }
        Update: {
          aylik_calisma_saati?: number
          created_at?: string
          gunluk_calisma_saati?: number
          id?: string
          resmi_tatiller?: Json
          sirket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ayarlar_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: true
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      banka_odeme: {
        Row: {
          avans: number
          banka: number
          bes: number
          bordro_id: string
          created_at: string
          donem_ay: number
          donem_yil: number
          elden_banka: number
          id: string
          odeme_not: string | null
          personel_id: string
          sirket_id: string
          tazminat: number
          updated_at: string
        }
        Insert: {
          avans?: number
          banka?: number
          bes?: number
          bordro_id: string
          created_at?: string
          donem_ay: number
          donem_yil: number
          elden_banka?: number
          id?: string
          odeme_not?: string | null
          personel_id: string
          sirket_id: string
          tazminat?: number
          updated_at?: string
        }
        Update: {
          avans?: number
          banka?: number
          bes?: number
          bordro_id?: string
          created_at?: string
          donem_ay?: number
          donem_yil?: number
          elden_banka?: number
          id?: string
          odeme_not?: string | null
          personel_id?: string
          sirket_id?: string
          tazminat?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banka_odeme_bordro_id_fkey"
            columns: ["bordro_id"]
            isOneToOne: true
            referencedRelation: "maas_bordro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banka_odeme_personel_id_fkey"
            columns: ["personel_id"]
            isOneToOne: false
            referencedRelation: "personel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banka_odeme_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      belge: {
        Row: {
          belge_no: string
          created_at: string
          gemi_id: string
          genel_toplam: number
          id: string
          ilgili_kisi_id: string | null
          iskonto: number
          kalemler: Json
          kdv_orani: number | null
          notlar: string | null
          para_birimi: string
          pdf_url: string | null
          sirket_id: string
          tarih: string
          toplam: number
          tur: string
          updated_at: string
        }
        Insert: {
          belge_no: string
          created_at?: string
          gemi_id: string
          genel_toplam?: number
          id?: string
          ilgili_kisi_id?: string | null
          iskonto?: number
          kalemler?: Json
          kdv_orani?: number | null
          notlar?: string | null
          para_birimi: string
          pdf_url?: string | null
          sirket_id: string
          tarih: string
          toplam?: number
          tur: string
          updated_at?: string
        }
        Update: {
          belge_no?: string
          created_at?: string
          gemi_id?: string
          genel_toplam?: number
          id?: string
          ilgili_kisi_id?: string | null
          iskonto?: number
          kalemler?: Json
          kdv_orani?: number | null
          notlar?: string | null
          para_birimi?: string
          pdf_url?: string | null
          sirket_id?: string
          tarih?: string
          toplam?: number
          tur?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belge_gemi_id_fkey"
            columns: ["gemi_id"]
            isOneToOne: false
            referencedRelation: "gemi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belge_ilgili_kisi_id_fkey"
            columns: ["ilgili_kisi_id"]
            isOneToOne: false
            referencedRelation: "ilgili_kisi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belge_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      bordro_ek_kalem: {
        Row: {
          ad: string
          bordro_id: string
          created_at: string | null
          id: string
          sira: number | null
          sirket_id: string
          tip: string
          tutar: number
        }
        Insert: {
          ad: string
          bordro_id: string
          created_at?: string | null
          id?: string
          sira?: number | null
          sirket_id: string
          tip: string
          tutar?: number
        }
        Update: {
          ad?: string
          bordro_id?: string
          created_at?: string | null
          id?: string
          sira?: number | null
          sirket_id?: string
          tip?: string
          tutar?: number
        }
        Relationships: [
          {
            foreignKeyName: "bordro_ek_kalem_bordro_id_fkey"
            columns: ["bordro_id"]
            isOneToOne: false
            referencedRelation: "maas_bordro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bordro_ek_kalem_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      cari_odeme: {
        Row: {
          aciklama: string | null
          baz_para_birimi: string | null
          baz_tutar: number | null
          belge_id: string
          created_at: string
          dekont_url: string | null
          id: string
          kur: number | null
          para_birimi: string
          sirket_id: string
          tarih: string
          tutar: number
          yontem: string
        }
        Insert: {
          aciklama?: string | null
          baz_para_birimi?: string | null
          baz_tutar?: number | null
          belge_id: string
          created_at?: string
          dekont_url?: string | null
          id?: string
          kur?: number | null
          para_birimi: string
          sirket_id: string
          tarih: string
          tutar: number
          yontem: string
        }
        Update: {
          aciklama?: string | null
          baz_para_birimi?: string | null
          baz_tutar?: number | null
          belge_id?: string
          created_at?: string
          dekont_url?: string | null
          id?: string
          kur?: number | null
          para_birimi?: string
          sirket_id?: string
          tarih?: string
          tutar?: number
          yontem?: string
        }
        Relationships: [
          {
            foreignKeyName: "cari_odeme_belge_id_fkey"
            columns: ["belge_id"]
            isOneToOne: false
            referencedRelation: "belge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cari_odeme_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_periods: {
        Row: {
          ayrilma_nedeni: string | null
          baslangic_tarihi: string
          bitis_tarihi: string | null
          created_at: string
          id: string
          ise_baslama_nedeni: string | null
          personel_id: string
          sirket_id: string
        }
        Insert: {
          ayrilma_nedeni?: string | null
          baslangic_tarihi: string
          bitis_tarihi?: string | null
          created_at?: string
          id?: string
          ise_baslama_nedeni?: string | null
          personel_id: string
          sirket_id: string
        }
        Update: {
          ayrilma_nedeni?: string | null
          baslangic_tarihi?: string
          bitis_tarihi?: string | null
          created_at?: string
          id?: string
          ise_baslama_nedeni?: string | null
          personel_id?: string
          sirket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_periods_personel_id_fkey"
            columns: ["personel_id"]
            isOneToOne: false
            referencedRelation: "personel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_periods_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      firma: {
        Row: {
          ad: string
          adres: string | null
          created_at: string
          email: string | null
          id: string
          notlar: string | null
          sirket_id: string
          telefon: string | null
          updated_at: string
          vergi_no: string | null
        }
        Insert: {
          ad: string
          adres?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notlar?: string | null
          sirket_id: string
          telefon?: string | null
          updated_at?: string
          vergi_no?: string | null
        }
        Update: {
          ad?: string
          adres?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notlar?: string | null
          sirket_id?: string
          telefon?: string | null
          updated_at?: string
          vergi_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "firma_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      gemi: {
        Row: {
          ad: string
          created_at: string
          firma_id: string | null
          id: string
          imo_no: string | null
          notlar: string | null
          sirket_id: string
          updated_at: string
        }
        Insert: {
          ad: string
          created_at?: string
          firma_id?: string | null
          id?: string
          imo_no?: string | null
          notlar?: string | null
          sirket_id: string
          updated_at?: string
        }
        Update: {
          ad?: string
          created_at?: string
          firma_id?: string | null
          id?: string
          imo_no?: string | null
          notlar?: string | null
          sirket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gemi_firma_id_fkey"
            columns: ["firma_id"]
            isOneToOne: false
            referencedRelation: "firma"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemi_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      ilgili_kisi: {
        Row: {
          ad: string
          created_at: string
          gemi_id: string
          id: string
          iletisim: string | null
          sirket_id: string
        }
        Insert: {
          ad: string
          created_at?: string
          gemi_id: string
          id?: string
          iletisim?: string | null
          sirket_id: string
        }
        Update: {
          ad?: string
          created_at?: string
          gemi_id?: string
          id?: string
          iletisim?: string | null
          sirket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ilgili_kisi_gemi_id_fkey"
            columns: ["gemi_id"]
            isOneToOne: false
            referencedRelation: "gemi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ilgili_kisi_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      kullanici_sirket: {
        Row: {
          created_at: string
          id: string
          kullanici_id: string
          rol: Database["public"]["Enums"]["kullanici_rol"]
          sirket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kullanici_id: string
          rol?: Database["public"]["Enums"]["kullanici_rol"]
          sirket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kullanici_id?: string
          rol?: Database["public"]["Enums"]["kullanici_rol"]
          sirket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kullanici_sirket_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      maas_bordro: {
        Row: {
          aciklama: string | null
          avans: number
          banka: number
          bes: number
          calisma_saati: number
          created_at: string
          donem_ay: number
          donem_yil: number
          durum: Database["public"]["Enums"]["bordro_durum"]
          elden: number
          iceri_avans_devir: number
          iceri_avans_kesinti: number
          iceri_avans_verilen: number
          icra: number
          id: string
          is_active_version: boolean
          maas_net: number
          mesai_saati: number
          notlar: Json
          parent_bordro_id: string | null
          personel_id: string
          prim: number
          revised_at: string | null
          revised_by: string | null
          revision_reason: string | null
          senelik_izin: number
          sirket_id: string
          tazminat: number
          toplam_kesinti: number
          toplam_odeme: number
          updated_at: string
          version_no: number
          yemek: number
          yillik_izin_gun: number
          yol: number
        }
        Insert: {
          aciklama?: string | null
          avans?: number
          banka?: number
          bes?: number
          calisma_saati?: number
          created_at?: string
          donem_ay: number
          donem_yil: number
          durum?: Database["public"]["Enums"]["bordro_durum"]
          elden?: number
          iceri_avans_devir?: number
          iceri_avans_kesinti?: number
          iceri_avans_verilen?: number
          icra?: number
          id?: string
          is_active_version?: boolean
          maas_net: number
          mesai_saati?: number
          notlar?: Json
          parent_bordro_id?: string | null
          personel_id: string
          prim?: number
          revised_at?: string | null
          revised_by?: string | null
          revision_reason?: string | null
          senelik_izin?: number
          sirket_id: string
          tazminat?: number
          toplam_kesinti?: number
          toplam_odeme?: number
          updated_at?: string
          version_no?: number
          yemek?: number
          yillik_izin_gun?: number
          yol?: number
        }
        Update: {
          aciklama?: string | null
          avans?: number
          banka?: number
          bes?: number
          calisma_saati?: number
          created_at?: string
          donem_ay?: number
          donem_yil?: number
          durum?: Database["public"]["Enums"]["bordro_durum"]
          elden?: number
          iceri_avans_devir?: number
          iceri_avans_kesinti?: number
          iceri_avans_verilen?: number
          icra?: number
          id?: string
          is_active_version?: boolean
          maas_net?: number
          mesai_saati?: number
          notlar?: Json
          parent_bordro_id?: string | null
          personel_id?: string
          prim?: number
          revised_at?: string | null
          revised_by?: string | null
          revision_reason?: string | null
          senelik_izin?: number
          sirket_id?: string
          tazminat?: number
          toplam_kesinti?: number
          toplam_odeme?: number
          updated_at?: string
          version_no?: number
          yemek?: number
          yillik_izin_gun?: number
          yol?: number
        }
        Relationships: [
          {
            foreignKeyName: "maas_bordro_parent_bordro_id_fkey"
            columns: ["parent_bordro_id"]
            isOneToOne: false
            referencedRelation: "maas_bordro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maas_bordro_personel_id_fkey"
            columns: ["personel_id"]
            isOneToOne: false
            referencedRelation: "personel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maas_bordro_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      maas_gecmisi: {
        Row: {
          aciklama: string | null
          created_at: string
          gecerlilik_baslangic: string
          gecerlilik_bitis: string | null
          id: string
          maas_net: number
          personel_id: string
          sirket_id: string
        }
        Insert: {
          aciklama?: string | null
          created_at?: string
          gecerlilik_baslangic: string
          gecerlilik_bitis?: string | null
          id?: string
          maas_net: number
          personel_id: string
          sirket_id: string
        }
        Update: {
          aciklama?: string | null
          created_at?: string
          gecerlilik_baslangic?: string
          gecerlilik_bitis?: string | null
          id?: string
          maas_net?: number
          personel_id?: string
          sirket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maas_gecmisi_personel_id_fkey"
            columns: ["personel_id"]
            isOneToOne: false
            referencedRelation: "personel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maas_gecmisi_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      personel: {
        Row: {
          ad: string
          adres: string | null
          banka_adi: string | null
          cinsiyet: Database["public"]["Enums"]["cinsiyet"] | null
          created_at: string
          dogum_tarihi: string | null
          email: string | null
          gorev_unvan: string | null
          hesap_no: string | null
          iban: string | null
          id: string
          sgk_sicil: string | null
          sirket_id: string
          soyad: string
          sube_kodu: string | null
          tc: string
          telefon: string | null
          updated_at: string
        }
        Insert: {
          ad: string
          adres?: string | null
          banka_adi?: string | null
          cinsiyet?: Database["public"]["Enums"]["cinsiyet"] | null
          created_at?: string
          dogum_tarihi?: string | null
          email?: string | null
          gorev_unvan?: string | null
          hesap_no?: string | null
          iban?: string | null
          id?: string
          sgk_sicil?: string | null
          sirket_id: string
          soyad: string
          sube_kodu?: string | null
          tc: string
          telefon?: string | null
          updated_at?: string
        }
        Update: {
          ad?: string
          adres?: string | null
          banka_adi?: string | null
          cinsiyet?: Database["public"]["Enums"]["cinsiyet"] | null
          created_at?: string
          dogum_tarihi?: string | null
          email?: string | null
          gorev_unvan?: string | null
          hesap_no?: string | null
          iban?: string | null
          id?: string
          sgk_sicil?: string | null
          sirket_id?: string
          soyad?: string
          sube_kodu?: string | null
          tc?: string
          telefon?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personel_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      proje: {
        Row: {
          aciklama: string | null
          ad: string
          adres_1: string | null
          adres_2: string | null
          baslangic_tarihi: string
          bitis_tarihi: string | null
          bolge: string | null
          created_at: string
          durum: string
          fatura_kodlari: Json
          firma_adi: string | null
          id: string
          sirket_id: string
          tersane_adi: string | null
          updated_at: string
        }
        Insert: {
          aciklama?: string | null
          ad: string
          adres_1?: string | null
          adres_2?: string | null
          baslangic_tarihi: string
          bitis_tarihi?: string | null
          bolge?: string | null
          created_at?: string
          durum?: string
          fatura_kodlari?: Json
          firma_adi?: string | null
          id?: string
          sirket_id: string
          tersane_adi?: string | null
          updated_at?: string
        }
        Update: {
          aciklama?: string | null
          ad?: string
          adres_1?: string | null
          adres_2?: string | null
          baslangic_tarihi?: string
          bitis_tarihi?: string | null
          bolge?: string | null
          created_at?: string
          durum?: string
          fatura_kodlari?: Json
          firma_adi?: string | null
          id?: string
          sirket_id?: string
          tersane_adi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proje_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      proje_donem_log: {
        Row: {
          aciklama: string | null
          baslangic: string
          bitis: string | null
          created_at: string
          created_by: string | null
          id: string
          proje_id: string
          sirket_id: string
        }
        Insert: {
          aciklama?: string | null
          baslangic: string
          bitis?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          proje_id: string
          sirket_id: string
        }
        Update: {
          aciklama?: string | null
          baslangic?: string
          bitis?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          proje_id?: string
          sirket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proje_donem_log_proje_id_fkey"
            columns: ["proje_id"]
            isOneToOne: false
            referencedRelation: "proje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proje_donem_log_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      puantaj_ay_ozet: {
        Row: {
          ay: number
          created_at: string | null
          id: string
          maas_saati_override: number | null
          personel_id: string
          sgk_gun_override: number | null
          sirket_id: string
          updated_at: string | null
          yil: number
        }
        Insert: {
          ay: number
          created_at?: string | null
          id?: string
          maas_saati_override?: number | null
          personel_id: string
          sgk_gun_override?: number | null
          sirket_id: string
          updated_at?: string | null
          yil: number
        }
        Update: {
          ay?: number
          created_at?: string | null
          id?: string
          maas_saati_override?: number | null
          personel_id?: string
          sgk_gun_override?: number | null
          sirket_id?: string
          updated_at?: string | null
          yil?: number
        }
        Relationships: [
          {
            foreignKeyName: "puantaj_ay_ozet_personel_id_fkey"
            columns: ["personel_id"]
            isOneToOne: false
            referencedRelation: "personel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puantaj_ay_ozet_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      puantaj_genel: {
        Row: {
          aciklama: string | null
          calisma_saati: number | null
          cikis_saati: string | null
          created_at: string
          giris_saati: string | null
          id: string
          kapali: boolean
          mesai_saati: number | null
          ozel_durum: string | null
          personel_id: string
          sirket_id: string
          tarih: string
          updated_at: string
        }
        Insert: {
          aciklama?: string | null
          calisma_saati?: number | null
          cikis_saati?: string | null
          created_at?: string
          giris_saati?: string | null
          id?: string
          kapali?: boolean
          mesai_saati?: number | null
          ozel_durum?: string | null
          personel_id: string
          sirket_id: string
          tarih: string
          updated_at?: string
        }
        Update: {
          aciklama?: string | null
          calisma_saati?: number | null
          cikis_saati?: string | null
          created_at?: string
          giris_saati?: string | null
          id?: string
          kapali?: boolean
          mesai_saati?: number | null
          ozel_durum?: string | null
          personel_id?: string
          sirket_id?: string
          tarih?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "puantaj_genel_personel_id_fkey"
            columns: ["personel_id"]
            isOneToOne: false
            referencedRelation: "personel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puantaj_genel_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      puantaj_proje: {
        Row: {
          aciklama: string | null
          created_at: string
          id: string
          mesai_saati: number | null
          ozel_durum: string | null
          personel_id: string
          proje_id: string
          saat: number | null
          sirket_id: string
          tarih: string
          updated_at: string
        }
        Insert: {
          aciklama?: string | null
          created_at?: string
          id?: string
          mesai_saati?: number | null
          ozel_durum?: string | null
          personel_id: string
          proje_id: string
          saat?: number | null
          sirket_id: string
          tarih: string
          updated_at?: string
        }
        Update: {
          aciklama?: string | null
          created_at?: string
          id?: string
          mesai_saati?: number | null
          ozel_durum?: string | null
          personel_id?: string
          proje_id?: string
          saat?: number | null
          sirket_id?: string
          tarih?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "puantaj_proje_personel_id_fkey"
            columns: ["personel_id"]
            isOneToOne: false
            referencedRelation: "personel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puantaj_proje_proje_id_fkey"
            columns: ["proje_id"]
            isOneToOne: false
            referencedRelation: "proje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puantaj_proje_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      sirketler: {
        Row: {
          ad: string
          adres: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          telefon: string | null
          updated_at: string
          vergi_no: string | null
        }
        Insert: {
          ad: string
          adres?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          telefon?: string | null
          updated_at?: string
          vergi_no?: string | null
        }
        Update: {
          ad?: string
          adres?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          telefon?: string | null
          updated_at?: string
          vergi_no?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      kullanici_sirket_erisim: {
        Args: { p_sirket_id: string }
        Returns: boolean
      }
    }
    Enums: {
      bordro_durum: "taslak" | "kontrol_bekliyor" | "onaylandi" | "kilitlendi"
      cinsiyet: "erkek" | "kadin"
      kullanici_rol: "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bordro_durum: ["taslak", "kontrol_bekliyor", "onaylandi", "kilitlendi"],
      cinsiyet: ["erkek", "kadin"],
      kullanici_rol: ["admin", "editor", "viewer"],
    },
  },
} as const

