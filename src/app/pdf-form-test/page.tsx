"use client";

import React, { useState, useRef } from "react";
import { saveAs } from "file-saver";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { NativeSelect } from "@/components/ui/native-select";
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  AlertTriangle, 
  Type, 
  Image as ImageIcon, 
  ArrowLeft,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface FieldConfig {
  name: string;
  type: "text" | "image";
  value: string;
  imageFile?: File;
  imagePreviewUrl?: string;
  originalType: string;
}

export default function PdfFormTestPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [processingState, setProcessingState] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("Dosya okunamadı."));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProcessingState("PDF yükleniyor ve çözümleniyor...");
    setError(null);
    setSuccess(null);
    setPdfFile(file);

    try {
      const bytes = await readFileAsArrayBuffer(file);
      setPdfBytes(bytes);

      const pdfDoc = await PDFDocument.load(bytes);
      const form = pdfDoc.getForm();
      const pdfFields = form.getFields();

      if (pdfFields.length === 0) {
        setError("Bu PDF dosyasında herhangi bir form alanı (AcroForm) bulunamadı. Lütfen doldurulabilir form alanları içeren bir PDF yükleyin.");
        setFields([]);
        setPdfFile(null);
        setPdfBytes(null);
        setLoading(false);
        return;
      }

      const extractedFields: FieldConfig[] = pdfFields.map((f) => {
        const name = f.getName();
        const originalType = f.constructor.name.replace("PDF", "");
        
        // Auto-detect if it is likely an image field (signature/stamp/logo/photo/image)
        const nameLower = name.toLowerCase();
        const isImg = 
          originalType === "Button" ||
          originalType === "Signature" ||
          nameLower.includes("signature") ||
          nameLower.includes("imza") ||
          nameLower.includes("stamp") ||
          nameLower.includes("kase") ||
          nameLower.includes("kaşe") ||
          nameLower.includes("image") ||
          nameLower.includes("resim") ||
          nameLower.includes("photo") ||
          nameLower.includes("foto") ||
          nameLower.includes("logo") ||
          nameLower.includes("sign") ||
          nameLower.includes("img");

        return {
          name,
          type: isImg ? "image" : "text",
          value: "",
          originalType
        };
      });

      setFields(extractedFields);
    } catch (err: any) {
      console.error(err);
      setError(`PDF yüklenirken hata oluştu: ${err.message || err}`);
      setPdfFile(null);
      setPdfBytes(null);
      setFields([]);
    } finally {
      setLoading(false);
      setProcessingState("");
    }
  };

  const handleFieldTypeChange = (index: number, newType: "text" | "image") => {
    setFields((prev) => {
      const next = [...prev];
      // Revoke old object URL if changing away from image
      if (newType === "text" && next[index].imagePreviewUrl) {
        URL.revokeObjectURL(next[index].imagePreviewUrl!);
      }
      next[index] = {
        ...next[index],
        type: newType,
        value: "",
        imageFile: undefined,
        imagePreviewUrl: undefined,
      };
      return next;
    });
  };

  const handleTextInputChange = (index: number, val: string) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value: val };
      return next;
    });
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setError("Lütfen sadece PNG veya JPG/JPEG formatında resim yükleyin.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFields((prev) => {
      const next = [...prev];
      if (next[index].imagePreviewUrl) {
        URL.revokeObjectURL(next[index].imagePreviewUrl!);
      }
      next[index] = {
        ...next[index],
        imageFile: file,
        imagePreviewUrl: previewUrl,
      };
      return next;
    });
  };

  const handleRemoveImage = (index: number) => {
    setFields((prev) => {
      const next = [...prev];
      if (next[index].imagePreviewUrl) {
        URL.revokeObjectURL(next[index].imagePreviewUrl!);
      }
      next[index] = {
        ...next[index],
        imageFile: undefined,
        imagePreviewUrl: undefined,
      };
      return next;
    });

    const fieldName = fields[index].name;
    if (imageInputsRef.current[fieldName]) {
      imageInputsRef.current[fieldName]!.value = "";
    }
  };

  const handleResetForm = () => {
    // Revoke all preview URLs
    fields.forEach((f) => {
      if (f.imagePreviewUrl) URL.revokeObjectURL(f.imagePreviewUrl);
    });

    setFields((prev) =>
      prev.map((f) => ({
        ...f,
        value: "",
        imageFile: undefined,
        imagePreviewUrl: undefined,
      }))
    );

    // Reset input fields in DOM
    Object.keys(imageInputsRef.current).forEach((key) => {
      if (imageInputsRef.current[key]) {
        imageInputsRef.current[key]!.value = "";
      }
    });

    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!pdfBytes || !pdfFile) {
      setError("Lütfen geçerli bir PDF dosyası yükleyin.");
      return;
    }

    setLoading(true);
    setProcessingState("PDF alanları dolduruluyor ve resimler yerleştiriliyor...");
    setError(null);
    setSuccess(null);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      for (const field of fields) {
        if (field.type === "text") {
          const f = form.getField(field.name);
          if (f) {
            try {
              if ("setText" in f) {
                (f as any).setText(field.value);
              } else if ("check" in f && (field.value.toLowerCase() === "true" || field.value.toLowerCase() === "yes" || field.value === "1")) {
                (f as any).check();
              } else {
                console.warn(`Alan "${field.name}" setText metoduna sahip değil. Tipi: ${field.originalType}`);
              }
            } catch (fieldErr) {
              console.error(`"${field.name}" alanı doldurulurken hata oluştu:`, fieldErr);
            }
          }
        } else if (field.type === "image" && field.imageFile) {
          const f = form.getField(field.name);
          if (f) {
            const imgBuffer = await readFileAsArrayBuffer(field.imageFile);
            let embeddedImage;

            if (field.imageFile.type === "image/png") {
              embeddedImage = await pdfDoc.embedPng(imgBuffer);
            } else {
              embeddedImage = await pdfDoc.embedJpg(imgBuffer);
            }

            const widgets = f.acroField.getWidgets();
            let drewImage = false;

            for (const widget of widgets) {
              const page = 
                pdfDoc.findPageForAnnotationRef((widget as any).ref) ??
                pdfDoc.getPages().find((p) => p.ref === widget.P());

              if (page) {
                const rect = widget.Rect()?.asRectangle();
                if (rect) {
                  page.drawImage(embeddedImage, {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                  });
                  drewImage = true;
                }
              }
            }

            if (drewImage) {
              // Remove the field so it doesn't render borders or obscure the image when flattened
              try {
                form.removeField(f);
              } catch (removeErr) {
                console.warn(`"${field.name}" alanı formdan kaldırılırken hata oluştu:`, removeErr);
              }
            }
          }
        }
      }

      // Flatten the form fields
      setProcessingState("Form düzleştiriliyor (düzenlenemez hale getiriliyor)...");
      form.flatten();

      // Save and Download
      setProcessingState("PDF oluşturuluyor ve indiriliyor...");
      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes] as any, { type: "application/pdf" });
      const downloadName = pdfFile.name.replace(".pdf", "_dolu.pdf");
      saveAs(blob, downloadName);

      setSuccess("PDF başarıyla dolduruldu, düzleştirildi ve indirildi!");
    } catch (err: any) {
      console.error(err);
      setError(`İşlem sırasında hata oluştu: ${err.message || err}`);
    } finally {
      setLoading(false);
      setProcessingState("");
    }
  };

  const handleResetAll = () => {
    // Clean up
    fields.forEach((f) => {
      if (f.imagePreviewUrl) URL.revokeObjectURL(f.imagePreviewUrl);
    });
    setPdfFile(null);
    setPdfBytes(null);
    setFields([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-zinc-950 text-white min-h-screen py-10 px-4 md:px-8">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center p-4">
          <Spinner className="size-12 text-primary" />
          <p className="text-lg font-medium tracking-wide animate-pulse">{processingState}</p>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white transition-colors text-sm">
                <ArrowLeft className="size-4 mr-1" />
                Ana Sayfa
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">PDF Form Doldurucu (Test)</h1>
            <p className="text-sm text-zinc-400">
              AcroForm içeren PDF dosyalarını yükleyin, form alanlarını dinamik olarak doldurun, resim/imza yerleştirin ve düzleştirip indirin.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pdfFile && (
              <Button 
                variant="outline" 
                onClick={handleResetAll}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                <RefreshCw className="size-4 mr-2" />
                Yeni PDF Yükle
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-200">
            <AlertTriangle className="size-4 text-red-400" />
            <AlertTitle className="font-semibold text-red-400">Hata Oluştu</AlertTitle>
            <AlertDescription className="text-red-300/90">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-emerald-950/20 border-emerald-900/50 text-emerald-200">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <AlertTitle className="font-semibold text-emerald-400">Başarılı</AlertTitle>
            <AlertDescription className="text-emerald-300/90">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Workspace */}
        {!pdfFile ? (
          /* Dropzone / Upload Area */
          <Card className="border-2 border-dashed border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all cursor-pointer">
            <CardContent 
              className="flex flex-col items-center justify-center py-16 px-6 text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePdfUpload}
                accept=".pdf" 
                className="hidden" 
              />
              <div className="rounded-full bg-zinc-950 p-4 border border-zinc-800 mb-4 group-hover:scale-105 transition-transform duration-200">
                <Upload className="size-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Form İçeren PDF Dosyasını Yükleyin</h3>
              <p className="text-sm text-zinc-500 max-w-md">
                Sürükleyip bırakın veya bilgisayarınızdan seçin. Sistem, PDF içindeki tüm düzenlenebilir form alanlarını (AcroForm) analiz edecektir.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Editor Layout */
          <div className="grid grid-cols-1 gap-8">
            {/* File Info */}
            <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                <FileText className="size-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-zinc-100">{pdfFile.name}</p>
                <p className="text-xs text-zinc-500">{(pdfFile.size / 1024).toFixed(1)} KB • {fields.length} form alanı bulundu</p>
              </div>
            </div>

            {/* Form Fields Editor */}
            <Card className="border-zinc-800 bg-zinc-900/40 shadow-xl">
              <CardHeader className="border-b border-zinc-800/80 pb-4">
                <CardTitle className="text-xl">Form Alanlarını Doldur</CardTitle>
                <CardDescription className="text-zinc-400">
                  Her bir alanı doldurun. Resim alanları için PNG veya JPG/JPEG yükleyebilirsiniz. Form indirildiğinde tüm alanlar düzleştirilecektir.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fields.map((field, idx) => (
                    <div 
                      key={field.name} 
                      className="flex flex-col gap-2 p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-xl hover:border-zinc-800 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-2">
                        <span className="font-semibold text-xs tracking-wide text-zinc-300 truncate max-w-[65%]">
                          {field.name}
                        </span>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-500 border border-zinc-800 font-mono">
                            {field.originalType}
                          </span>
                          <NativeSelect 
                            value={field.type}
                            onChange={(e) => handleFieldTypeChange(idx, e.target.value as "text" | "image")}
                            className="h-7 text-xs py-0"
                            size="sm"
                          >
                            <option value="text">Metin</option>
                            <option value="image">Resim/İmza</option>
                          </NativeSelect>
                        </div>
                      </div>

                      <div className="pt-1 flex-1 flex flex-col justify-end">
                        {field.type === "text" ? (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-zinc-400">Değer</Label>
                            <Input 
                              type="text" 
                              placeholder="Metin giriniz..." 
                              value={field.value}
                              onChange={(e) => handleTextInputChange(idx, e.target.value)}
                              className="border-zinc-800 bg-zinc-950 focus:border-zinc-700 text-sm text-zinc-200 h-9"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label className="text-xs text-zinc-400">Resim Seç (PNG/JPG)</Label>
                            {!field.imageFile ? (
                              <div 
                                onClick={() => imageInputsRef.current[field.name]?.click()}
                                className="border border-dashed border-zinc-800 rounded-lg p-4 text-center cursor-pointer hover:bg-zinc-900/40 hover:border-zinc-700 transition-all flex flex-col items-center justify-center gap-1.5"
                              >
                                <input 
                                  type="file" 
                                  ref={el => { imageInputsRef.current[field.name] = el }}
                                  onChange={(e) => handleImageUpload(idx, e)}
                                  accept=".png, .jpg, .jpeg" 
                                  className="hidden" 
                                />
                                <ImageIcon className="size-4 text-zinc-500" />
                                <span className="text-xs text-zinc-400 font-medium">Görsel Seç</span>
                              </div>
                            ) : (
                              <div className="relative border border-zinc-800 rounded-lg p-2 bg-zinc-900 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {field.imagePreviewUrl && (
                                    <div className="relative size-10 rounded border border-zinc-800 bg-black overflow-hidden flex-shrink-0">
                                      <img 
                                        src={field.imagePreviewUrl} 
                                        alt="Önizleme" 
                                        className="object-contain w-full h-full"
                                      />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs text-zinc-300 font-medium truncate">{field.imageFile.name}</p>
                                    <p className="text-[10px] text-zinc-500">{(field.imageFile.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => handleRemoveImage(idx)}
                                  variant="destructive" 
                                  size="icon-xs"
                                  title="Görseli kaldır"
                                  className="shrink-0"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-zinc-800/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button 
                    onClick={handleResetForm}
                    variant="outline"
                    className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 w-full sm:w-auto"
                  >
                    Formu Temizle
                  </Button>
                </div>
                <Button 
                  onClick={handleSubmit}
                  className="bg-white hover:bg-zinc-200 text-zinc-950 font-semibold px-6 w-full sm:w-auto"
                >
                  <Download className="size-4 mr-2" />
                  Doldur, Düzleştir ve İndir
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
