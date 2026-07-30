"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocxViewer } from "@/components/ui/DocxViewer";
import { generateSampleDocx, EvrakData } from "@/lib/docx-sample-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Download,
  FileCheck,
  Sparkles,
  Settings2,
  Maximize2,
  Minimize2,
  FilePlus,
  Eye,
  CheckCircle2,
  Info,
} from "lucide-react";

const PRESET_TEMPLATES: { name: string; desc: string; data: EvrakData }[] = [
  {
    name: "Resmi İzin Talebi Dilekçesi",
    desc: "Şirket içi yıllık izin başvuru evrağı şablonu",
    data: {
      evrakNo: "EVR-2026-1042",
      tarih: "22.07.2026",
      alici: "İNSAN KAYNAKLARI DİREKTÖRLÜĞÜNE",
      gonderen: "Ahmet Yılmaz",
      unvan: "Yazılım Geliştirme Uzmanı",
      konu: "Yıllık İzin Talebi ve Evrak Onayı Hakkında",
      icerik:
        "Şirketiniz bünyesinde Yazılım Geliştirme Uzmanı olarak görev yapmaktayım.\n\n" +
        "2026 yılı hak etmiş olduğum yıllık ücretli iznimin 5 (beş) iş günlük kısmını 01.08.2026 - 05.08.2026 tarihleri arasında kullanmak istiyorum.\n\n" +
        "İzinde olacağım süre zarfında acil durumlar için tarafıma telefon ve e-posta yoluyla ulaşılabilecektir. Görevlerimin aksamaması adına gerekli devir teslim işlemleri çalışma arkadaşım Mehmet Demir'e yapılmıştır.\n\n" +
        "Gereğini bilgilerinize arz ederim.",
    },
  },
  {
    name: "Kurumsal Hizmet Sözleşmesi",
    desc: "Müşteri onayına sunulacak evrak şablonu",
    data: {
      evrakNo: "SZL-2026-0089",
      tarih: "22.07.2026",
      alici: "ABC TEKNOLOJİ VE DANIŞMANLIK A.Ş.",
      gonderen: "Mehmet Öztürk",
      unvan: "Genel Müdür",
      konu: "Yazılım ve Altyapı Danışmanlık Hizmet Sözleşmesi",
      icerik:
        "MADDE 1 - TARAFLAR\n" +
        "İşbu sözleşme Muhasebe & Evrak Sistemleri A.Ş. ile ABC Teknoloji Danışmanlık A.Ş. arasında aşağıdaki şartlar çerçevesinde imzalanmıştır.\n\n" +
        "MADDE 2 - SÖZLEŞMENİN KONUSU\n" +
        "İşbu sözleşmenin konusu, Hizmet Alan tarafın bulut evrak yönetimi ve muhasebe altyapısının kurulumu, bakımı ve 7/24 destek hizmetlerinin sağlanmasıdır.\n\n" +
        "MADDE 3 - YÜKÜMLÜLÜKLER VE GİZLİLİK\n" +
        "Taraflar, işbu sözleşme kapsamında edindikleri tüm ticari ve teknik sırları 3. şahıslarla paylaşmayacağını kabul ve taahhüt eder.",
    },
  },
  {
    name: "Mali Onay ve Harcama Formu",
    desc: "Şirket içi muhasebe evrak talebi",
    data: {
      evrakNo: "MLY-2026-4410",
      tarih: "22.07.2026",
      alici: "MALİ İŞLER VE MUHASEBE MÜDÜRLÜĞÜNE",
      gonderen: "Ayşe Kaya",
      unvan: "Operasyon Yöneticisi",
      konu: "Donanım ve Lisans Satın Alma Mali Onay Talebi",
      icerik:
        "Departmanımız bünyesinde kullanılmak üzere ihtiyaç duyulan 3 adet sunucu lisansı ve yedekleme donanımı için tedarikçi firmadan alınan teklif ekte sunulmuştur.\n\n" +
        "Toplam Bütçe: 45.000 TL + KDV\n" +
        "Ödeme Planı: 30 Gün Vadeli Fatura\n\n" +
        "Söz konusu satın almanın gerçekleştirilmesi için mali onayın verilmesini arz ederim.",
    },
  },
];

export default function DocxTestPage() {
  const [currentFile, setCurrentFile] = useState<File | Blob | ArrayBuffer | string | null>(null);
  const [fileName, setFileName] = useState<string>("Ornek_Evrak.docx");
  const [fileSize, setFileSize] = useState<string>("—");
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Render options
  const [renderHeaders, setRenderHeaders] = useState<boolean>(true);
  const [renderFooters, setRenderFooters] = useState<boolean>(true);
  const [breakPages, setBreakPages] = useState<boolean>(true);

  // Form State for Evrak Data
  const [evrakFormData, setEvrakFormData] = useState<EvrakData>(PRESET_TEMPLATES[0].data);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Load default sample template on mount
  useEffect(() => {
    handleLoadPreset(0);
  }, []);

  const handleLoadPreset = async (index: number) => {
    setLoading(true);
    const template = PRESET_TEMPLATES[index];
    setEvrakFormData(template.data);
    try {
      const blob = await generateSampleDocx(template.data);
      setCurrentFile(blob);
      setFileName(`${template.data.evrakNo}_${template.name.replace(/\s+/g, "_")}.docx`);
      setFileSize(`${(blob.size / 1024).toFixed(1)} KB`);
    } catch (e) {
      console.error("Örnek DOCX oluşturulamadı", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFormGenerate = async () => {
    setLoading(true);
    try {
      const blob = await generateSampleDocx(evrakFormData);
      setCurrentFile(blob);
      setFileName(`${evrakFormData.evrakNo || "EVRAK"}_Canli.docx`);
      setFileSize(`${(blob.size / 1024).toFixed(1)} KB`);
    } catch (e) {
      console.error("Dinamik DOCX hatası", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      alert("Lütfen geçerli bir .docx uzantılı Microsoft Word dosyası seçin.");
      return;
    }

    setCurrentFile(file);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".docx")) {
      setCurrentFile(file);
      setFileName(file.name);
      setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    } else {
      alert("Lütfen sadece .docx uzantılı dosya sürükleyin.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!currentFile) return;
    const url = typeof currentFile === "string" ? currentFile : URL.createObjectURL(currentFile as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-lg">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight">Evrak Sistemi DOCX Önizleme</h1>
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Online Renderer
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Tarayıcı üzerinde `.docx` evrak görüntüleme & şablon test aracı
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              title="Küçült (-15%)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-2 min-w-[50px] text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.min(200, z + 15))}
              title="Büyüt (+15%)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom(100)}
              title="Sıfırla (%100)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* Upload Button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Dosya Yükle</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".docx"
            className="hidden"
          />

          {/* Print Button */}
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Yazdır</span>
          </Button>

          {/* Download Button */}
          <Button variant="default" size="sm" className="gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">İndir</span>
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 ml-1"
            onClick={() => setIsFullscreen((fs) => !fs)}
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className={`flex-1 flex flex-col md:flex-row overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 bg-slate-900" : ""}`}>
        {/* LEFT SIDEBAR / CONTROL PANEL */}
        <aside
          className={`${
            isFullscreen ? "hidden md:flex" : "flex"
          } w-full md:w-[380px] lg:w-[420px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 overflow-y-auto`}
        >
          <Tabs defaultValue="presets" className="w-full flex-1 flex flex-col">
            <div className="px-4 pt-3 border-b border-slate-200 dark:border-slate-800">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="presets" className="text-xs gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Şablonlar
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs gap-1.5">
                  <FilePlus className="h-3.5 w-3.5" />
                  Evrak Yapılandır
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" />
                  Ayarlar
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: PRESETS & UPLOAD */}
            <TabsContent value="presets" className="p-4 space-y-4 flex-1">
              {/* DRAG & DROP ZONE */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/50 group"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  .DOCX Dosyanızı Buraya Sürükleyin
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  veya bilgisayarınızdan seçmek için tıklayın
                </p>
              </div>

              {/* CURRENT FILE INFO */}
              <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3 truncate">
                  <FileCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-medium truncate">{fileName}</p>
                    <p className="text-[10px] text-muted-foreground">Boyut: {fileSize}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  DOCX
                </Badge>
              </div>

              {/* PRESET TEMPLATES LIST */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Örnek Evrak Şablonları
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Tek Tıkla Yükle</span>
                </div>

                {PRESET_TEMPLATES.map((tmpl, idx) => (
                  <Card
                    key={idx}
                    onClick={() => handleLoadPreset(idx)}
                    className="cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all border-slate-200 dark:border-slate-800"
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          {tmpl.name}
                        </CardTitle>
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <CardDescription className="text-xs mt-1">
                        {tmpl.desc}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB 2: DYNAMIC EVRAK BUILDER */}
            <TabsContent value="custom" className="p-4 space-y-3 flex-1 overflow-y-auto">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Evrak sistemindeki alanları doldurarak anında yeni `.docx` belgesi oluşturun ve canlı önizleyin.
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Evrak No</Label>
                    <Input
                      size={1}
                      className="h-8 text-xs"
                      value={evrakFormData.evrakNo}
                      onChange={(e) => setEvrakFormData({ ...evrakFormData, evrakNo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Tarih</Label>
                    <Input
                      size={1}
                      className="h-8 text-xs"
                      value={evrakFormData.tarih}
                      onChange={(e) => setEvrakFormData({ ...evrakFormData, tarih: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Alıcı Makam / Kurum</Label>
                  <Input
                    className="h-8 text-xs"
                    value={evrakFormData.alici}
                    onChange={(e) => setEvrakFormData({ ...evrakFormData, alici: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Gönderen Adı</Label>
                    <Input
                      className="h-8 text-xs"
                      value={evrakFormData.gonderen}
                      onChange={(e) => setEvrakFormData({ ...evrakFormData, gonderen: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Ünvanı</Label>
                    <Input
                      className="h-8 text-xs"
                      value={evrakFormData.unvan}
                      onChange={(e) => setEvrakFormData({ ...evrakFormData, unvan: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Konu</Label>
                  <Input
                    className="h-8 text-xs"
                    value={evrakFormData.konu}
                    onChange={(e) => setEvrakFormData({ ...evrakFormData, konu: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Evrak İçerik Metni</Label>
                  <Textarea
                    className="text-xs min-h-[120px] leading-relaxed"
                    value={evrakFormData.icerik}
                    onChange={(e) => setEvrakFormData({ ...evrakFormData, icerik: e.target.value })}
                  />
                </div>

                <Button
                  onClick={handleCustomFormGenerate}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs font-semibold"
                >
                  <Sparkles className="h-4 w-4" />
                  Dinamik DOCX Oluştur & Canlı Önizle
                </Button>
              </div>
            </TabsContent>

            {/* TAB 3: RENDER SETTINGS */}
            <TabsContent value="settings" className="p-4 space-y-4 flex-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <Label className="text-sm font-medium">Sayfa Sonları (Page Breaks)</Label>
                    <p className="text-xs text-muted-foreground">Word sayfa kesmelerini ayrı sayfalar olarak işler</p>
                  </div>
                  <Switch checked={breakPages} onCheckedChange={setBreakPages} />
                </div>

                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <Label className="text-sm font-medium">Üst Bilgiler (Headers)</Label>
                    <p className="text-xs text-muted-foreground">Sayfa üstü başlıklarını ve logoları göster</p>
                  </div>
                  <Switch checked={renderHeaders} onCheckedChange={setRenderHeaders} />
                </div>

                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <Label className="text-sm font-medium">Alt Bilgiler (Footers)</Label>
                    <p className="text-xs text-muted-foreground">Sayfa altı imza ve sayfa numaralarını göster</p>
                  </div>
                  <Switch checked={renderFooters} onCheckedChange={setRenderFooters} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {/* MAIN PREVIEW CONTAINER */}
        <main
          ref={previewContainerRef}
          className="flex-1 bg-slate-200/70 dark:bg-slate-950 flex flex-col relative overflow-hidden"
        >
          <DocxViewer
            file={currentFile}
            zoom={zoom}
            options={{
              breakPages,
              renderHeaders,
              renderFooters,
            }}
            onLoadingChange={setLoading}
          />
        </main>
      </div>
    </div>
  );
}
