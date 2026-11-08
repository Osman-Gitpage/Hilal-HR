-- ============================================================
-- hilal_tevzi_kayitlari tablosu
-- Supabase SQL Editor'e yapıştırıp çalıştırın
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hilal_tevzi_kayitlari (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  sirket_id       uuid          NOT NULL REFERENCES public.sirketler(id) ON DELETE CASCADE,
  tarih           date          NOT NULL,
  satirlar        jsonb         NOT NULL DEFAULT '[]'::jsonb,
  olusturan_id    uuid          NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  guncellendi_at  timestamptz   NOT NULL DEFAULT now(),

  -- Aynı şirkete ait aynı gün için tek kayıt
  UNIQUE (sirket_id, tarih)
);

-- ─── İndeksler ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hilal_tevzi_sirket_tarih
  ON public.hilal_tevzi_kayitlari (sirket_id, tarih DESC);

-- ─── RLS (Row Level Security) ────────────────────────────────
ALTER TABLE public.hilal_tevzi_kayitlari ENABLE ROW LEVEL SECURITY;

-- Sadece kendi şirketinin kayıtlarını görebilir
CREATE POLICY "Kendi şirket kayıtlarını gör"
  ON public.hilal_tevzi_kayitlari
  FOR SELECT
  USING (
    sirket_id IN (
      SELECT sirket_id FROM public.kullanici_sirket
      WHERE kullanici_id = auth.uid()
    )
  );

-- Kendi şirketine kayıt ekleyebilir / güncelleyebilir
CREATE POLICY "Kendi şirkete kayıt ekle/güncelle"
  ON public.hilal_tevzi_kayitlari
  FOR INSERT
  WITH CHECK (
    sirket_id IN (
      SELECT sirket_id FROM public.kullanici_sirket
      WHERE kullanici_id = auth.uid()
    )
  );

CREATE POLICY "Kendi şirket kaydını güncelle"
  ON public.hilal_tevzi_kayitlari
  FOR UPDATE
  USING (
    sirket_id IN (
      SELECT sirket_id FROM public.kullanici_sirket
      WHERE kullanici_id = auth.uid()
    )
  );
