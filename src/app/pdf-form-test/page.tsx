"use client";

import React, { useState, useRef } from "react";
import { saveAs } from "file-saver";
import { PDFDocument, PDFTextField, PDFCheckBox } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as XLSX from "xlsx";
import JSZip from "jszip";
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
  RefreshCw,
  FileSpreadsheet,
  Users,
  FileArchive
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

interface BulkImageConfig {
  mode: "single" | "multiple";
  singleFile?: File;
  singlePreviewUrl?: string;
  multipleFiles?: File[];
}

export default function PdfFormTestPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [processingState, setProcessingState] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [namingField, setNamingField] = useState<string>("");
  const [bulkFileName, setBulkFileName] = useState<string>("");
  const [bulkImages, setBulkImages] = useState<Record<string, BulkImageConfig>>({});

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
      
      // Register fontkit
      pdfDoc.registerFontkit(fontkit);

      // Load Roboto font to support Turkish characters in text fields
      setProcessingState("Türkçe karakter desteği için yazı tipi yükleniyor...");
      const fontResponse = await fetch("/fonts/Roboto.ttf");
      if (!fontResponse.ok) {
        throw new Error("Yazı tipi (Roboto.ttf) yüklenemedi. Lütfen public/fonts klasöründe Roboto.ttf dosyasının bulunduğundan emin olun.");
      }
      const fontBytes = await fontResponse.arrayBuffer();
      const customFont = await pdfDoc.embedFont(fontBytes);

      const form = pdfDoc.getForm();

      for (const field of fields) {
        if (field.type === "text") {
          const f = form.getField(field.name);
          if (f) {
            try {
              if (f instanceof PDFTextField) {
                f.setText(field.value);
                f.updateAppearances(customFont);
              } else if (f instanceof PDFCheckBox) {
                if (field.value.toLowerCase() === "true" || field.value.toLowerCase() === "yes" || field.value === "1") {
                  f.check();
                } else {
                  f.uncheck();
                }
                f.updateAppearances();
              } else if ("setText" in f) {
                (f as any).setText(field.value);
                if ("updateAppearances" in f && typeof (f as any).updateAppearances === "function") {
                  (f as any).updateAppearances(customFont);
                }
              } else if ("check" in f && (field.value.toLowerCase() === "true" || field.value.toLowerCase() === "yes" || field.value === "1")) {
                (f as any).check();
                if ("updateAppearances" in f && typeof (f as any).updateAppearances === "function") {
                  (f as any).updateAppearances();
                }
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
      form.flatten({ updateFieldAppearances: false });

      // Save and Download
      setProcessingState("PDF oluşturuluyor ve indiriliyor...");
      const savedBytes = await pdfDoc.save({ updateFieldAppearances: false });
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

  const downloadExcelTemplate = () => {
    if (!pdfFile || fields.length === 0) return;
    try {
      const headers = fields.map((f) => f.name);
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Form Verileri");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const templateName = `sablon_${pdfFile.name.replace(".pdf", "")}.xlsx`;
      saveAs(blob, templateName);
      setSuccess("Excel şablonu başarıyla indirildi. Lütfen bu dosyaya verilerinizi girip tekrar yükleyin.");
    } catch (err: any) {
      console.error(err);
      setError(`Şablon oluşturulurken hata oluştu: ${err.message || err}`);
    }
  };

  const handleBulkDataUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProcessingState("Veri dosyası yükleniyor ve çözümleniyor...");
    setError(null);
    setSuccess(null);
    setBulkFileName(file.name);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: "dd.mm.yyyy" });

      if (json.length === 0) {
        throw new Error("Yüklenen dosyada veri bulunamadı.");
      }

      setBulkData(json);
      
      const keys = Object.keys(json[0] as any);
      const possibleNamingFields = ["ad", "soyad", "ad soyad", "adı soyadı", "name", "full name", "müşteri adı", "isim", "ad_soyad"];
      const found = keys.find(k => possibleNamingFields.includes(k.toLowerCase().trim()));
      setNamingField(found || keys[0] || "");
      setSuccess(`${json.length} adet kayıt başarıyla yüklendi!`);
    } catch (err: any) {
      console.error(err);
      setError(`Veri yüklenirken hata oluştu: ${err.message || err}`);
      setBulkData([]);
      setNamingField("");
      setBulkFileName("");
    } finally {
      setLoading(false);
      setProcessingState("");
      e.target.value = "";
    }
  };

  const handleBulkSubmit = async () => {
    if (!pdfBytes || !pdfFile || bulkData.length === 0) {
      setError("Geçerli bir PDF ve veri dosyası yüklediğinizden emin olun.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      setProcessingState("Türkçe karakter desteği için yazı tipi yükleniyor...");
      const fontResponse = await fetch("/fonts/Roboto.ttf");
      if (!fontResponse.ok) {
        throw new Error("Yazı tipi (Roboto.ttf) yüklenemedi. Lütfen public/fonts klasöründe Roboto.ttf dosyasının bulunduğundan emin olun.");
      }
      const fontBytes = await fontResponse.arrayBuffer();

      const zip = new JSZip();
      
      for (let i = 0; i < bulkData.length; i++) {
        const row = bulkData[i];
        setProcessingState(`PDF oluşturuluyor (${i + 1}/${bulkData.length}): ${row[namingField] || "Kayıt " + (i + 1)}...`);

        const pdfDoc = await PDFDocument.load(pdfBytes);
        pdfDoc.registerFontkit(fontkit);
        const customFont = await pdfDoc.embedFont(fontBytes);
        const form = pdfDoc.getForm();

        for (const field of fields) {
          const f = form.getField(field.name);
          if (f) {
            try {
              if (field.type === "image") {
                const imgConfig = bulkImages[field.name];
                let imageFile: File | undefined = undefined;

                if (imgConfig) {
                  if (imgConfig.mode === "single") {
                    imageFile = imgConfig.singleFile;
                  } else if (imgConfig.mode === "multiple" && imgConfig.multipleFiles) {
                    const rowVal = row[namingField] ? String(row[namingField]) : "";
                    const cleanString = (str: string) => str.toLowerCase().replace(/[^a-z0-9ışğüşöç]/gi, "").trim();
                    const target = cleanString(rowVal);
                    
                    imageFile = imgConfig.multipleFiles.find(file => {
                      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                      return cleanString(nameWithoutExt) === target;
                    });
                  }
                }

                if (imageFile) {
                  const imgBuffer = await readFileAsArrayBuffer(imageFile);
                  let embeddedImage;

                  if (imageFile.type === "image/png") {
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
                    try {
                      form.removeField(f);
                    } catch (removeErr) {
                      console.warn(`"${field.name}" alanı formdan kaldırılırken hata oluştu:`, removeErr);
                    }
                  }
                }
              } else {
                const rowKeys = Object.keys(row);
                const matchedKey = rowKeys.find(k => k.trim().toLowerCase() === field.name.trim().toLowerCase()) || field.name;
                const val = row[matchedKey] !== undefined ? String(row[matchedKey]) : "";

                if (f instanceof PDFTextField) {
                  f.setText(val);
                  f.updateAppearances(customFont);
                } else if (f instanceof PDFCheckBox) {
                  if (val.toLowerCase() === "true" || val.toLowerCase() === "yes" || val === "1") {
                    f.check();
                  } else {
                    f.uncheck();
                  }
                  f.updateAppearances();
                } else if ("setText" in f) {
                  (f as any).setText(val);
                  if ("updateAppearances" in f && typeof (f as any).updateAppearances === "function") {
                    (f as any).updateAppearances(customFont);
                  }
                } else if ("check" in f && (val.toLowerCase() === "true" || val.toLowerCase() === "yes" || val === "1")) {
                  (f as any).check();
                  if ("updateAppearances" in f && typeof (f as any).updateAppearances === "function") {
                    (f as any).updateAppearances();
                  }
                }
              }
            } catch (fieldErr) {
              console.error(`"${field.name}" alanı doldurulurken hata oluştu:`, fieldErr);
            }
          }
        }

        form.flatten({ updateFieldAppearances: false });
        const savedBytes = await pdfDoc.save({ updateFieldAppearances: false });

        let rawFileName = row[namingField] ? String(row[namingField]) : `kayit_${i + 1}`;
        const cleanName = rawFileName.replace(/[^a-zA-Z0-9ışğüşöİŞĞÜŞÖ\s-_]/g, "").trim();
        const fileName = `${cleanName || `kayit_${i + 1}`}.pdf`;

        zip.file(fileName, savedBytes);
      }

      setProcessingState("ZIP dosyası hazırlanıyor...");
      const zipContent = await zip.generateAsync({ type: "blob" });
      const zipName = `toplu_pdf_${pdfFile.name.replace(".pdf", "")}.zip`;
      saveAs(zipContent, zipName);

      setSuccess(`Başarılı! Toplam ${bulkData.length} adet PDF dosyası oluşturuldu ve ${zipName} adıyla indirildi.`);
    } catch (err: any) {
      console.error(err);
      setError(`Toplu işlem sırasında hata oluştu: ${err.message || err}`);
    } finally {
      setLoading(false);
      setProcessingState("");
    }
  };

  const handleBulkImageUpload = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>, isSingle: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isSingle) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setBulkImages((prev) => {
        const old = prev[fieldName];
        if (old?.singlePreviewUrl) URL.revokeObjectURL(old.singlePreviewUrl);
        return {
          ...prev,
          [fieldName]: {
            mode: "single",
            singleFile: file,
            singlePreviewUrl: previewUrl,
          },
        };
      });
    } else {
      const fileList = Array.from(files);
      setBulkImages((prev) => ({
        ...prev,
        [fieldName]: {
          mode: "multiple",
          multipleFiles: fileList,
        },
      }));
    }
  };

  const handleRemoveBulkImage = (fieldName: string) => {
    setBulkImages((prev) => {
      const old = prev[fieldName];
      if (old?.singlePreviewUrl) URL.revokeObjectURL(old.singlePreviewUrl);
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleResetAll = () => {
    fields.forEach((f) => {
      if (f.imagePreviewUrl) URL.revokeObjectURL(f.imagePreviewUrl);
    });
    Object.values(bulkImages).forEach((cfg) => {
      if (cfg.singlePreviewUrl) URL.revokeObjectURL(cfg.singlePreviewUrl);
    });
    setPdfFile(null);
    setPdfBytes(null);
    setFields([]);
    setError(null);
    setSuccess(null);
    setActiveTab("single");
    setBulkData([]);
    setNamingField("");
    setBulkFileName("");
    setBulkImages({});
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

            {/* Tab Selection */}
            <div className="flex border-b border-zinc-800 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("single")}
                className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "single"
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Users className="size-4" />
                Tek Kişi İçin Doldur
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bulk")}
                className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "bulk"
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <FileSpreadsheet className="size-4" />
                Toplu Veri Yükleme (Excel/CSV)
              </button>
            </div>

            {activeTab === "single" ? (
              /* Form Fields Editor */
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
                    className="bg-white hover:bg-zinc-200 text-zinc-950 font-semibold px-6 w-full sm:w-auto cursor-pointer"
                  >
                    <Download className="size-4 mr-2" />
                    Doldur, Düzleştir ve İndir
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              /* Bulk Entry Workspace */
              <Card className="border-zinc-800 bg-zinc-900/40 shadow-xl">
                <CardHeader className="border-b border-zinc-800/80 pb-4">
                  <CardTitle className="text-xl">Toplu Veri Yükleme ve Dosya Oluşturma</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Excel veya CSV dosyanızı yükleyerek tablodaki tüm kişiler için otomatik olarak PDF dosyası oluşturup tek seferde ZIP formatında indirebilirsiniz.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Steps and Template Download */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Step 1 */}
                    <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-xl space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-200">
                        <span className="flex items-center justify-center size-5 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                        Excel Şablonunu İndirin
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        PDF dosyanızdaki form alanlarına uygun olarak oluşturulmuş Excel şablonunu indirin ve verilerinizi (Türkçe karakterler dahil) bu dosyaya doldurun.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={downloadExcelTemplate}
                        className="border-zinc-800 hover:bg-zinc-900 text-xs w-full justify-center cursor-pointer"
                      >
                        <Download className="size-3.5 mr-1.5" />
                        Excel Şablonunu İndir (.xlsx)
                      </Button>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-xl space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-200">
                        <span className="flex items-center justify-center size-5 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                        Doldurduğunuz Dosyayı Yükleyin
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Verilerinizi yazdığınız Excel (.xlsx, .xls) veya CSV dosyasını buraya yükleyin. Sütun başlıkları PDF form alanları ile otomatik eşleşecektir.
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          id="bulk-upload-input"
                          onChange={handleBulkDataUpload}
                          accept=".xlsx, .xls, .csv"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          onClick={() => document.getElementById("bulk-upload-input")?.click()}
                          className="bg-white hover:bg-zinc-200 text-zinc-950 text-xs w-full justify-center cursor-pointer"
                        >
                          <Upload className="size-3.5 mr-1.5" />
                          {bulkFileName ? `${bulkFileName} (Değiştir)` : "Excel/CSV Dosyası Yükle"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Images / Signatures Config */}
                  {fields.some(f => f.type === "image") && (
                    <div className="space-y-4 border-t border-zinc-800 pt-6">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-200">
                          <ImageIcon className="size-4 text-zinc-400" />
                          Görsel / İmza Alanlarını Ayarlayın
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Formdaki her bir resim/imza alanı için tek bir ortak resim kullanabilir veya yüklediğiniz listedeki kişi isimleriyle eşleşen ayrı görseller yükleyebilirsiniz.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fields.filter(f => f.type === "image").map((field) => {
                          const config = bulkImages[field.name] || { mode: "single" };
                          return (
                            <div key={field.name} className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl space-y-4">
                              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                                <span className="text-xs font-semibold text-zinc-300 truncate max-w-[50%]" title={field.name}>
                                  {field.name} <span className="text-[10px] text-zinc-500 font-mono">({field.originalType})</span>
                                </span>
                                
                                <NativeSelect
                                  value={config.mode}
                                  onChange={(e) => {
                                    const mode = e.target.value as "single" | "multiple";
                                    setBulkImages(prev => ({
                                      ...prev,
                                      [field.name]: {
                                        mode,
                                        singleFile: undefined,
                                        singlePreviewUrl: undefined,
                                        multipleFiles: undefined
                                      }
                                    }));
                                  }}
                                  className="h-7 text-xs py-0 w-32"
                                  size="sm"
                                >
                                  <option value="single">Ortak Resim</option>
                                  <option value="multiple">Kişiye Özel</option>
                                </NativeSelect>
                              </div>

                              {config.mode === "single" ? (
                                <div className="space-y-2">
                                  <Label className="text-[11px] text-zinc-400">Tüm Kayıtlarda Kullanılacak Ortak Resim</Label>
                                  {!config.singleFile ? (
                                    <div 
                                      onClick={() => document.getElementById(`bulk-img-single-${field.name}`)?.click()}
                                      className="border border-dashed border-zinc-800 rounded-lg p-4 text-center cursor-pointer hover:bg-zinc-900/40 hover:border-zinc-700 transition-all flex flex-col items-center justify-center gap-1.5"
                                    >
                                      <input 
                                        type="file" 
                                        id={`bulk-img-single-${field.name}`}
                                        onChange={(e) => handleBulkImageUpload(field.name, e, true)}
                                        accept=".png, .jpg, .jpeg" 
                                        className="hidden" 
                                      />
                                      <ImageIcon className="size-4 text-zinc-500" />
                                      <span className="text-xs text-zinc-450 font-medium">Görsel Seç</span>
                                    </div>
                                  ) : (
                                    <div className="relative border border-zinc-800 rounded-lg p-2 bg-zinc-900 flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {config.singlePreviewUrl && (
                                          <div className="relative size-10 rounded border border-zinc-800 bg-black overflow-hidden flex-shrink-0">
                                            <img 
                                              src={config.singlePreviewUrl} 
                                              alt="Önizleme" 
                                              className="object-contain w-full h-full"
                                            />
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <p className="text-xs text-zinc-350 font-medium truncate">{config.singleFile.name}</p>
                                          <p className="text-[10px] text-zinc-550">{(config.singleFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                      </div>
                                      <Button 
                                        onClick={() => handleRemoveBulkImage(field.name)}
                                        variant="destructive" 
                                        size="icon-xs"
                                        className="shrink-0"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Label className="text-[11px] text-zinc-400">Çoklu Görsel Seçimi (Resim isimleri kişi isimleriyle eşleşmeli)</Label>
                                  <div 
                                    onClick={() => document.getElementById(`bulk-img-multiple-${field.name}`)?.click()}
                                    className="border border-dashed border-zinc-800 rounded-lg p-4 text-center cursor-pointer hover:bg-zinc-900/40 hover:border-zinc-700 transition-all flex flex-col items-center justify-center gap-1.5"
                                  >
                                    <input 
                                      type="file" 
                                      id={`bulk-img-multiple-${field.name}`}
                                      onChange={(e) => handleBulkImageUpload(field.name, e, false)}
                                      accept=".png, .jpg, .jpeg" 
                                      multiple
                                      className="hidden" 
                                    />
                                    <Upload className="size-4 text-zinc-500" />
                                    <span className="text-xs text-zinc-450 font-medium">Birden Fazla Görsel Seç</span>
                                  </div>
                                  {config.multipleFiles && config.multipleFiles.length > 0 && (
                                    <div className="text-xs bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-zinc-400">
                                      <span className="font-semibold text-white">{config.multipleFiles.length}</span> adet görsel yüklendi.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bulk Data Preview and Settings */}
                  {bulkData.length > 0 && (
                    <div className="space-y-6 border-t border-zinc-800 pt-6">
                      {/* Settings / Naming */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end bg-zinc-950/50 p-4 border border-zinc-800/80 rounded-xl">
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-300 font-medium">
                            PDF Dosyalarını Adlandırmak İçin Kullanılacak Sütun (Kolon)
                          </Label>
                          <p className="text-[10px] text-zinc-500">
                            Her bir satır için oluşturulan PDF dosyası bu sütundaki veriyle adlandırılacaktır.
                          </p>
                          <NativeSelect
                            value={namingField}
                            onChange={(e) => setNamingField(e.target.value)}
                            className="h-9 text-xs"
                          >
                            {Object.keys(bulkData[0]).map((key) => (
                              <option key={key} value={key}>
                                {key}
                              </option>
                            ))}
                          </NativeSelect>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-zinc-400 flex-1">
                            <span className="font-semibold text-white">{bulkData.length}</span> kayıt bulundu. Hazır olduğunuzda indirin.
                          </div>
                        </div>
                      </div>

                      {/* Preview Table */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Veri Önizleme</h4>
                        <div className="overflow-x-auto border border-zinc-800 rounded-lg max-h-[250px]">
                          <table className="min-w-full divide-y divide-zinc-800 text-left text-xs text-zinc-300">
                            <thead className="bg-zinc-900 text-zinc-400 font-mono text-[10px] sticky top-0">
                              <tr>
                                <th className="px-4 py-2.5 border-r border-zinc-800">#</th>
                                {Object.keys(bulkData[0]).map((header) => (
                                  <th key={header} className="px-4 py-2.5 border-r border-zinc-800">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 bg-zinc-950/20">
                              {bulkData.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="hover:bg-zinc-900/40">
                                  <td className="px-4 py-2 border-r border-zinc-800 font-mono text-zinc-500">{idx + 1}</td>
                                  {Object.keys(bulkData[0]).map((header) => (
                                    <td key={header} className="px-4 py-2 border-r border-zinc-800 truncate max-w-[150px]">
                                      {String(row[header] ?? "")}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {bulkData.length > 5 && (
                          <p className="text-[10px] text-zinc-500 italic text-right">
                            * Yalnızca ilk 5 kayıt önizlenmektedir. Toplam {bulkData.length} kayıt işlenecektir.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t border-zinc-800/80 p-6 flex items-center justify-between">
                  <Button 
                    onClick={() => {
                      setBulkData([]);
                      setNamingField("");
                      setBulkFileName("");
                    }}
                    variant="outline"
                    className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    disabled={bulkData.length === 0}
                  >
                    Verileri Temizle
                  </Button>
                  <Button 
                    onClick={handleBulkSubmit}
                    disabled={bulkData.length === 0}
                    className="bg-white hover:bg-zinc-200 text-zinc-950 font-semibold px-6 disabled:opacity-50 cursor-pointer"
                  >
                    <FileArchive className="size-4 mr-2" />
                    Toplu PDF Oluştur ve İndir (.ZIP)
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
