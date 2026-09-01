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
      arac_cezalar: {
        Row: {
          aciklama: string | null
          arac_id: string
          ceza_turu: string
          created_at: string | null
          id: string
          sirket_id: string
          tarih: string
          tutar: number
        }
        Insert: {
          aciklama?: string | null
          arac_id: string
          ceza_turu: string
          created_at?: string | null
          id?: string
          sirket_id: string
          tarih: string
          tutar: number
        }
        Update: {
          aciklama?: string | null
          arac_id?: string
          ceza_turu?: string
          created_at?: string | null
          id?: string
          sirket_id?: string
          tarih?: string
          tutar?: number
        }
        Relationships: [
          {
            foreignKeyName: "arac_cezalar_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arac_cezalar_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      arac_muayene: {
        Row: {
          arac_id: string
          belge_adi: string | null
          belge_url: string | null
          egzoz_emisyon_tarihi: string | null
          id: string
          istasyon: string | null
          muayene_tarihi: string
          muayene_ucreti: number | null
          rapor_no: string | null
          sirket_id: string
          sonuc: string | null
          updated_at: string | null
        }
        Insert: {
          arac_id: string
          belge_adi?: string | null
          belge_url?: string | null
          egzoz_emisyon_tarihi?: string | null
          id?: string
          istasyon?: string | null
          muayene_tarihi: string
          muayene_ucreti?: number | null
          rapor_no?: string | null
          sirket_id: string
          sonuc?: string | null
          updated_at?: string | null
        }
        Update: {
          arac_id?: string
          belge_adi?: string | null
          belge_url?: string | null
          egzoz_emisyon_tarihi?: string | null
          id?: string
          istasyon?: string | null
          muayene_tarihi?: string
          muayene_ucreti?: number | null
          rapor_no?: string | null
          sirket_id?: string
          sonuc?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arac_muayene_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: true
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arac_muayene_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      arac_policeler: {
        Row: {
          arac_id: string
          belge_adi: string | null
          belge_url: string | null
          bitis_tarihi: string
          created_at: string | null
          id: string
          police_no: string
          sirket: string
          sirket_id: string
          tur: string
          tutar: number | null
        }
        Insert: {
          arac_id: string
          belge_adi?: string | null
          belge_url?: string | null
          bitis_tarihi: string
          created_at?: string | null
          id?: string
          police_no: string
          sirket: string
          sirket_id: string
          tur: string
          tutar?: number | null
        }
        Update: {
          arac_id?: string
          belge_adi?: string | null
          belge_url?: string | null
          bitis_tarihi?: string
          created_at?: string | null
          id?: string
          police_no?: string
          sirket?: string
          sirket_id?: string
          tur?: string
          tutar?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arac_policeler_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arac_policeler_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      arac_servis_kayitlari: {
        Row: {
          aciklama: string
          arac_id: string
          created_at: string | null
          fatura_dosya_adi: string | null
          fatura_dosya_url: string | null
          fatura_no: string | null
          id: string
          islem_turu: string
          km: number
          servis_adi: string
          sirket_id: string
          tarih: string
          tutar: number
          yil: number
        }
        Insert: {
          aciklama: string
          arac_id: string
          created_at?: string | null
          fatura_dosya_adi?: string | null
          fatura_dosya_url?: string | null
          fatura_no?: string | null
          id?: string
          islem_turu: string
          km: number
          servis_adi: string
          sirket_id: string
          tarih: string
          tutar: number
          yil: number
        }
        Update: {
          aciklama?: string
          arac_id?: string
          created_at?: string | null
          fatura_dosya_adi?: string | null
          fatura_dosya_url?: string | null
          fatura_no?: string | null
          id?: string
          islem_turu?: string
          km?: number
          servis_adi?: string
          sirket_id?: string
          tarih?: string
          tutar?: number
          yil?: number
        }
        Relationships: [
          {
            foreignKeyName: "arac_servis_kayitlari_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arac_servis_kayitlari_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      arac_yakit_kayitlari: {
        Row: {
          arac_id: string
          ay: string
          belge_no: string | null
          birim_fiyat: number
          created_at: string | null
          id: string
          miktar: number
          sirket_id: string
          toplam_tutar: number
          yakit_turu: string
          yil: number
        }
        Insert: {
          arac_id: string
          ay: string
          belge_no?: string | null
          birim_fiyat: number
          created_at?: string | null
          id?: string
          miktar: number
          sirket_id: string
          toplam_tutar: number
          yakit_turu: string
          yil: number
        }
        Update: {
          arac_id?: string
          ay?: string
          belge_no?: string | null
          birim_fiyat?: number
          created_at?: string | null
          id?: string
          miktar?: number
          sirket_id?: string
          toplam_tutar?: number
          yakit_turu?: string
          yil?: number
        }
        Relationships: [
          {
            foreignKeyName: "arac_yakit_kayitlari_arac_id_fkey"
            columns: ["arac_id"]
            isOneToOne: false
            referencedRelation: "araclar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arac_yakit_kayitlari_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      araclar: {
        Row: {
          alt_baslik: string | null
          created_at: string | null
          gorsel: string | null
          id: string
          km: number | null
          marka: string
          model: string
          motor_no: string | null
          paket: string | null
          plaka: string
          ruhsat_seri_no: string | null
          sase_no: string | null
          sirket_id: string
          updated_at: string | null
          vites: string
          yakit_tipi: string
          yil: number
        }
        Insert: {
          alt_baslik?: string | null
          created_at?: string | null
          gorsel?: string | null
          id?: string
          km?: number | null
          marka: string
          model: string
          motor_no?: string | null
          paket?: string | null
          plaka: string
          ruhsat_seri_no?: string | null
          sase_no?: string | null
          sirket_id: string
          updated_at?: string | null
          vites: string
          yakit_tipi: string
          yil: number
        }
        Update: {
          alt_baslik?: string | null
          created_at?: string | null
          gorsel?: string | null
          id?: string
          km?: number | null
          marka?: string
          model?: string
          motor_no?: string | null
          paket?: string | null
          plaka?: string
          ruhsat_seri_no?: string | null
          sase_no?: string | null
          sirket_id?: string
          updated_at?: string | null
          vites?: string
          yakit_tipi?: string
          yil?: number
        }
        Relationships: [
          {
            foreignKeyName: "araclar_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
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
          aciklama: string
          belge_no: string
          created_at: string
          firma_id: string | null
          gemi_adi: string | null
          id: string
          kur: number
          notlar: string | null
          para_birimi: string
          sirket_id: string
          tarih: string
          tur: string
          tutar: number
          updated_at: string
        }
        Insert: {
          aciklama: string
          belge_no: string
          created_at?: string
          firma_id?: string | null
          gemi_adi?: string | null
          id?: string
          kur?: number
          notlar?: string | null
          para_birimi: string
          sirket_id: string
          tarih: string
          tur: string
          tutar: number
          updated_at?: string
        }
        Update: {
          aciklama?: string
          belge_no?: string
          created_at?: string
          firma_id?: string | null
          gemi_adi?: string | null
          id?: string
          kur?: number
          notlar?: string | null
          para_birimi?: string
          sirket_id?: string
          tarih?: string
          tur?: string
          tutar?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belge_firma_id_fkey"
            columns: ["firma_id"]
            isOneToOne: false
            referencedRelation: "firma"
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
      belge_dosya: {
        Row: {
          belge_id: string
          boyut_byte: number | null
          cift_no: number | null
          created_at: string
          dosya_adi: string
          dosya_tipi: string
          dosya_url: string
          id: string
          kategori: string
          sirket_id: string
        }
        Insert: {
          belge_id: string
          boyut_byte?: number | null
          cift_no?: number | null
          created_at?: string
          dosya_adi: string
          dosya_tipi: string
          dosya_url: string
          id?: string
          kategori?: string
          sirket_id: string
        }
        Update: {
          belge_id?: string
          boyut_byte?: number | null
          cift_no?: number | null
          created_at?: string
          dosya_adi?: string
          dosya_tipi?: string
          dosya_url?: string
          id?: string
          kategori?: string
          sirket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "belge_dosya_belge_id_fkey"
            columns: ["belge_id"]
            isOneToOne: false
            referencedRelation: "belge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belge_dosya_sirket_id_fkey"
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
      evrak: {
        Row: {
          baslangic_tarihi: string | null
          bitis_tarihi: string | null
          created_at: string
          dosya_adi: string
          dosya_boyut: number | null
          dosya_tipi: string | null
          dosya_url: string
          durum: string
          employment_period_id: string | null
          id: string
          kategori_id: string
          onay_durumu: string
          personel_id: string | null
          sirket_id: string
          updated_at: string
          versiyon: number
          yuklenme_tarihi: string
        }
        Insert: {
          baslangic_tarihi?: string | null
          bitis_tarihi?: string | null
          created_at?: string
          dosya_adi: string
          dosya_boyut?: number | null
          dosya_tipi?: string | null
          dosya_url: string
          durum?: string
          employment_period_id?: string | null
          id?: string
          kategori_id: string
          onay_durumu?: string
          personel_id?: string | null
          sirket_id: string
          updated_at?: string
          versiyon?: number
          yuklenme_tarihi?: string
        }
        Update: {
          baslangic_tarihi?: string | null
          bitis_tarihi?: string | null
          created_at?: string
          dosya_adi?: string
          dosya_boyut?: number | null
          dosya_tipi?: string | null
          dosya_url?: string
          durum?: string
          employment_period_id?: string | null
          id?: string
          kategori_id?: string
          onay_durumu?: string
          personel_id?: string | null
          sirket_id?: string
          updated_at?: string
          versiyon?: number
          yuklenme_tarihi?: string
        }
        Relationships: [
          {
            foreignKeyName: "evrak_employment_period_id_fkey"
            columns: ["employment_period_id"]
            isOneToOne: false
            referencedRelation: "employment_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evrak_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "evrak_kategori"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evrak_personel_id_fkey"
            columns: ["personel_id"]
            isOneToOne: false
            referencedRelation: "personel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evrak_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      evrak_kategori: {
        Row: {
          ad: string
          aktif: boolean
          created_at: string
          id: string
          sira: number
          sirket_id: string
          sureli: boolean
          tip: string
          updated_at: string
          varsayilan_sure: number | null
          zorunlu: boolean
        }
        Insert: {
          ad: string
          aktif?: boolean
          created_at?: string
          id?: string
          sira?: number
          sirket_id: string
          sureli?: boolean
          tip: string
          updated_at?: string
          varsayilan_sure?: number | null
          zorunlu?: boolean
        }
        Update: {
          ad?: string
          aktif?: boolean
          created_at?: string
          id?: string
          sira?: number
          sirket_id?: string
          sureli?: boolean
          tip?: string
          updated_at?: string
          varsayilan_sure?: number | null
          zorunlu?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "evrak_kategori_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
      evrak_log: {
        Row: {
          detay: Json | null
          evrak_id: string | null
          id: string
          islem: string
          kullanici_id: string | null
          sirket_id: string
          tarih: string
        }
        Insert: {
          detay?: Json | null
          evrak_id?: string | null
          id?: string
          islem: string
          kullanici_id?: string | null
          sirket_id: string
          tarih?: string
        }
        Update: {
          detay?: Json | null
          evrak_id?: string | null
          id?: string
          islem?: string
          kullanici_id?: string | null
          sirket_id?: string
          tarih?: string
        }
        Relationships: [
          {
            foreignKeyName: "evrak_log_evrak_id_fkey"
            columns: ["evrak_id"]
            isOneToOne: false
            referencedRelation: "evrak"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evrak_log_sirket_id_fkey"
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
      odeme: {
        Row: {
          aciklama: string | null
          belge_id: string
          created_at: string
          id: string
          kur: number
          para_birimi: string
          sirket_id: string
          tarih: string
          tutar: number
          yontem: string
        }
        Insert: {
          aciklama?: string | null
          belge_id: string
          created_at?: string
          id?: string
          kur?: number
          para_birimi: string
          sirket_id: string
          tarih: string
          tutar: number
          yontem: string
        }
        Update: {
          aciklama?: string | null
          belge_id?: string
          created_at?: string
          id?: string
          kur?: number
          para_birimi?: string
          sirket_id?: string
          tarih?: string
          tutar?: number
          yontem?: string
        }
        Relationships: [
          {
            foreignKeyName: "odeme_belge_id_fkey"
            columns: ["belge_id"]
            isOneToOne: false
            referencedRelation: "belge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odeme_sirket_id_fkey"
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
          mesai_saati_override: number | null
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
          mesai_saati_override?: number | null
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
          mesai_saati_override?: number | null
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
      tersane_ozel_belge: {
        Row: {
          ad: string
          created_at: string
          id: string
          sablon_dosya_url: string | null
          sablon_tipi: string | null
          sira: number
          sirket_id: string
          tersane_sablon_id: string
          updated_at: string
        }
        Insert: {
          ad: string
          created_at?: string
          id?: string
          sablon_dosya_url?: string | null
          sablon_tipi?: string | null
          sira?: number
          sirket_id: string
          tersane_sablon_id: string
          updated_at?: string
        }
        Update: {
          ad?: string
          created_at?: string
          id?: string
          sablon_dosya_url?: string | null
          sablon_tipi?: string | null
          sira?: number
          sirket_id?: string
          tersane_sablon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tersane_ozel_belge_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tersane_ozel_belge_tersane_sablon_id_fkey"
            columns: ["tersane_sablon_id"]
            isOneToOne: false
            referencedRelation: "tersane_sablon"
            referencedColumns: ["id"]
          },
        ]
      }
      tersane_sablon: {
        Row: {
          ad: string
          aktif: boolean
          created_at: string
          id: string
          sirket_id: string
          standart_kategoriler: Json
          updated_at: string
        }
        Insert: {
          ad: string
          aktif?: boolean
          created_at?: string
          id?: string
          sirket_id: string
          standart_kategoriler?: Json
          updated_at?: string
        }
        Update: {
          ad?: string
          aktif?: boolean
          created_at?: string
          id?: string
          sirket_id?: string
          standart_kategoriler?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tersane_sablon_sirket_id_fkey"
            columns: ["sirket_id"]
            isOneToOne: false
            referencedRelation: "sirketler"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      evrak_varsayilan_kategoriler_olustur: {
        Args: { p_sirket_id: string }
        Returns: undefined
      }
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
