"use client";

import React, { useState, useEffect, useRef } from "react";
import { saveAs } from "file-saver";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { 
  Users, 
  Calendar as CalendarIcon, 
  Wrench, 
  MapPin, 
  Mail, 
  FileDown, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Upload, 
  ClipboardCheck,
  Send,
  Share2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

// Sabit Personel Listesi
const DEFAULT_PERSONNEL = [
  "Abdulkadir Turan",
  "Erol Günay",
  "Harun Turan",
  "Hayrettin Usta",
  "İsrafil Turan",
  "Metin Kılınç",
  "Osman Aşçı",
  "Şaban Gültepe",
];

// Popüler Hızlı Görev Seçenekleri
const QUICK_TASKS = [
  "Karkas Yapımı",
  "İzolasyon Yapımı",
  "Kaplama Yapımı",
  "Kaynak & Montaj",
  "Genel İşçilik",
];

// Hızlı Alan Önerileri
const QUICK_AREAS = [
  "Karkas Sahası",
  "İzolasyon Sahası",
  "Saha 1",
  "Saha 2",
  "A Blok",
  "B Blok",
  "Kazan Dairesi",
];

interface WorkAreaGroup {
  id: string;
  name: string;
  assignedPersons: string[];
}

export default function HilalTevziPage() {
  const getTodayFormatted = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // State'ler
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [docDate, setDocDate] = useState<string>(getTodayFormatted());
  const [recipientEmail, setRecipientEmail] = useState<string>("edgetr55@gmail.com");
  
  // Personel Havuzu
  const [personnelPool, setPersonnelPool] = useState<string[]>(DEFAULT_PERSONNEL);
  const [newPersonName, setNewPersonName] = useState<string>("");
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);

  // Görevler
  const [personTasks, setPersonTasks] = useState<Record<string, string>>({});

  // Çalışma Alanı Grupları
  const [workAreas, setWorkAreas] = useState<WorkAreaGroup[]>([
    { id: "1", name: "", assignedPersons: [] },
  ]);

  // Önceden Hazırlanmış PDF & Varlık Önbelleği (iOS Safari 0ms Share için)
  const cachedTemplateBytesRef = useRef<ArrayBuffer | null>(null);
  const cachedFontBytesRef = useRef<ArrayBuffer | null>(null);
  const [prebuiltPdfFile, setPrebuiltPdfFile] = useState<File | null>(null);
  const [isPrebuilding, setIsPrebuilding] = useState<boolean>(false);

  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("");
  const [customPdfFile, setCustomPdfFile] = useState<File | null>(null);
  const [templateNotFound, setTemplateNotFound] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sayfa açıldığında şablon ve fontu RAM'e önden yükle
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const tplResp = await fetch("/hilal-tevzi-sablon.pdf");
        if (tplResp.ok) {
          cachedTemplateBytesRef.current = await tplResp.arrayBuffer();
        }
      } catch (e) {}

      try {
        let fontResp = await fetch("/fonts/TimesNewRoman.ttf");
        if (!fontResp.ok) fontResp = await fetch("/fonts/Roboto.ttf");
        if (fontResp.ok) {
          cachedFontBytesRef.current = await fontResp.arrayBuffer();
        }
      } catch (e) {}
    };

    preloadAssets();
  }, []);

  // 1. ADIM: Kişi Seçimi
  const togglePersonSelection = (name: string) => {
    if (selectedPersons.includes(name)) {
      setSelectedPersons(prev => prev.filter(p => p !== name));
      setPersonTasks(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
      setWorkAreas(prev => prev.map(area => ({
        ...area,
        assignedPersons: area.assignedPersons.filter(p => p !== name)
      })));
    } else {
      if (selectedPersons.length >= 10) {
        toast.warning("En fazla 10 kişi seçebilirsiniz (PDF form limiti).");
        return;
      }
      setSelectedPersons(prev => [...prev, name]);
    }
  };

  const selectAllPersonnel = () => {
    const top10 = personnelPool.slice(0, 10);
    setSelectedPersons(top10);
  };

  const deselectAllPersonnel = () => {
    setSelectedPersons([]);
    setPersonTasks({});
    setWorkAreas([{ id: "1", name: "", assignedPersons: [] }]);
  };

  const handleAddCustomPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPersonName.trim();
    if (!trimmed) return;
    if (personnelPool.includes(trimmed)) {
      toast.info("Bu kişi zaten listede mevcut.");
      return;
    }
    setPersonnelPool(prev => [...prev, trimmed]);
    if (selectedPersons.length < 10) {
      setSelectedPersons(prev => [...prev, trimmed]);
    }
    setNewPersonName("");
  };

  // 2. ADIM: Görev Atama
  const handleSetTask = (person: string, task: string) => {
    setPersonTasks(prev => ({ ...prev, [person]: task }));
  };

  // 3. ADIM: Çalışma Alanı Yönetimi
  const addWorkArea = () => {
    setWorkAreas(prev => [
      ...prev,
      { id: Date.now().toString(), name: "", assignedPersons: [] }
    ]);
  };

  const removeWorkArea = (id: string) => {
    setWorkAreas(prev => prev.filter(a => a.id !== id));
  };

  const updateWorkAreaName = (id: string, name: string) => {
    setWorkAreas(prev => prev.map(a => a.id === id ? { ...a, name } : a));
  };

  const togglePersonInArea = (areaId: string, person: string) => {
    setWorkAreas(prev => prev.map(area => {
      if (area.id === areaId) {
        const exists = area.assignedPersons.includes(person);
        return {
          ...area,
          assignedPersons: exists 
            ? area.assignedPersons.filter(p => p !== person)
            : [...area.assignedPersons, person]
        };
      } else {
        return {
          ...area,
          assignedPersons: area.assignedPersons.filter(p => p !== person)
        };
      }
    }));
  };

  const getPersonArea = (person: string): string => {
    for (const area of workAreas) {
      if (area.assignedPersons.includes(person)) {
        return area.name || "—";
      }
    }
    return "";
  };

  // PDF Oluşturma Çekirdeği
  const generatePdfInstance = async (): Promise<File> => {
    let pdfBytes = customPdfFile ? await customPdfFile.arrayBuffer() : cachedTemplateBytesRef.current;

    if (!pdfBytes) {
      try {
        const resp = await fetch("/hilal-tevzi-sablon.pdf");
        if (resp.ok) {
          pdfBytes = await resp.arrayBuffer();
          cachedTemplateBytesRef.current = pdfBytes;
        }
      } catch (e) {}
    }

    if (!pdfBytes) {
      setTemplateNotFound(true);
      throw new Error("Şablon PDF dosyası bulunamadı.");
    }

    let fontBytes = cachedFontBytesRef.current;
    if (!fontBytes) {
      try {
        const fResp = await fetch("/fonts/TimesNewRoman.ttf");
        if (fResp.ok) {
          fontBytes = await fResp.arrayBuffer();
          cachedFontBytesRef.current = fontBytes;
        }
      } catch (e) {}
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);

    let customFont: any = null;
    if (fontBytes) {
      try {
        customFont = await pdfDoc.embedFont(fontBytes);
      } catch (e) {}
    }

    const form = pdfDoc.getForm();

    // Tarih
    try {
      const tarihField = form.getTextField("tarih");
      if (tarihField) {
        tarihField.setText(docDate || "");
        if (customFont) tarihField.updateAppearances(customFont);
      }
    } catch (tErr) {}

    // 10 Satır
    for (let i = 1; i <= 10; i++) {
      const personIndex = i - 1;
      const person = selectedPersons[personIndex];
      const task = person ? (personTasks[person] || "") : "";
      const area = person ? (getPersonArea(person) === "—" ? "" : getPersonArea(person)) : "";

      try {
        const adSoyadField = form.getTextField(`ad_soyad_${i}`);
        if (adSoyadField) {
          adSoyadField.setText(person || "");
          if (customFont) adSoyadField.updateAppearances(customFont);
        }
      } catch (e) {}

      try {
        const gorevField = form.getTextField(`gorev_${i}`);
        if (gorevField) {
          gorevField.setText(task);
          if (customFont) gorevField.updateAppearances(customFont);
        }
      } catch (e) {}

      try {
        const calismaAlaniField = form.getTextField(`calisma_alani_${i}`);
        if (calismaAlaniField) {
          calismaAlaniField.setText(area);
          if (customFont) calismaAlaniField.updateAppearances(customFont);
        }
      } catch (e) {}
    }

    form.flatten({ updateFieldAppearances: false });
    const savedBytes = await pdfDoc.save({ updateFieldAppearances: false });
    const blob = new Blob([savedBytes as any], { type: "application/pdf" });

    const cleanDate = docDate ? docDate.replace(/[/\\?%*:|"<>]/g, ".") : "tarihsiz";
    const fileName = `Hilal ${cleanDate}.pdf`;

    return new File([blob], fileName, { type: "application/pdf" });
  };

  // 4. Adıma (Özet) geçildiğinde PDF'i arka planda HEMEN oluşturup RAM'e koy (iOS Gesture Delay Sıfırlama)
  useEffect(() => {
    if (currentStep === 4 && selectedPersons.length > 0) {
      setIsPrebuilding(true);
      generatePdfInstance()
        .then((file) => {
          setPrebuiltPdfFile(file);
        })
        .catch((err) => {
          console.warn("Ön PDF oluşturma hatası:", err);
        })
        .finally(() => {
          setIsPrebuilding(false);
        });
    }
  }, [currentStep, selectedPersons, personTasks, workAreas, docDate]);

  // 4. ADIM: Mail / Gmail ile Gönder (Anında Senkron Tetikleme)
  const handleSendViaEmailApp = async () => {
    if (selectedPersons.length === 0) {
      toast.error("Lütfen en az bir personel seçin.");
      return;
    }

    const emailSubject = `Hilal Tevzi Listesi - ${docDate}`;
    const emailBody = `Merhaba,\n\nHilal ${docDate} tarihli günlük tevzi listesi ekte yer almaktadır.\n\nİyi çalışmalar.`;

    // 1. Eğer önceden hazırlanmış PDF hazırsa (iOS Safari kullanıcı dokunma süresi aşılmadan anında çalışır)
    const targetFile = prebuiltPdfFile || (await generatePdfInstance());

    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [targetFile] })) {
      try {
        await navigator.share({
          files: [targetFile],
          title: emailSubject,
          text: `${emailBody}\n\nAlıcı: ${recipientEmail}`,
        });
        return;
      } catch (shareErr: any) {
        if (shareErr.name === "AbortError") {
          return;
        }
        console.warn("Paylaşım hatası:", shareErr);
      }
    }

    // 2. Güvensiz HTTP veya masaüstü ortamındaysa alternatif
    saveAs(targetFile, targetFile.name);
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    toast.info("PDF indirildi ve Mail açıldı.");
  };

  // Sadece İndir
  const handleOnlyDownload = async () => {
    setPdfLoading(true);
    setLoadingText("PDF İndiriliyor...");
    try {
      const file = prebuiltPdfFile || (await generatePdfInstance());
      saveAs(file, file.name);
      toast.success(`${file.name} indirildi!`);
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
    } finally {
      setPdfLoading(false);
      setLoadingText("");
    }
  };

  const handleManualPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomPdfFile(file);
      setTemplateNotFound(false);
      toast.success(`'${file.name}' şablon seçildi.`);
    }
  };

  const goToNextStep = () => {
    if (currentStep === 1 && selectedPersons.length === 0) {
      toast.warning("Lütfen en az bir personel seçin.");
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between pb-32 selection:bg-slate-900 selection:text-white">
      {/* Loading Overlay */}
      {pdfLoading && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3.5 max-w-xs w-full">
            <div className="size-10 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900">{loadingText}</p>
              <p className="text-xs text-slate-500">Lütfen bekleyin...</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto space-y-2.5">
          {/* Top Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                H
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">Hilal Tevzi Formu</h1>
                <p className="text-[11px] text-slate-500">Günlük Personel Dağılımı</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700">
              <CalendarIcon className="size-3.5 text-slate-500" />
              <span>{docDate}</span>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {[
              { num: 1, label: "Kişiler" },
              { num: 2, label: "Görev" },
              { num: 3, label: "Alan" },
              { num: 4, label: "Özet" },
            ].map((step) => {
              const isActive = currentStep === step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-4 flex-1 w-full space-y-4">
        
        {/* ========================================================
            ADIM 1: TARİH & KİŞİLER
        ======================================================== */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Tarih Kartı */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">Form Tarihi</span>
                <span className="text-sm font-semibold text-slate-800">Tarihi Belirle</span>
              </div>
              <input
                type="text"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                placeholder="11.09.2026"
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg text-right w-32 focus:outline-none focus:border-slate-400 focus:bg-white transition"
              />
            </div>

            {/* Kişi Seçimi Başlığı */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="size-4 text-slate-700" />
                  Çalışan Personeller
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedPersons.length} / 10 kişi seçildi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPersonnel}
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2"
                >
                  Tümünü Seç
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={deselectAllPersonnel}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  Temizle
                </button>
              </div>
            </div>

            {/* Personel Listesi */}
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-xs overflow-hidden">
              {personnelPool.map((person) => {
                const isSelected = selectedPersons.includes(person);
                const selIndex = selectedPersons.indexOf(person) + 1;
                return (
                  <button
                    key={person}
                    type="button"
                    onClick={() => togglePersonSelection(person)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 text-left transition-colors cursor-pointer ${
                      isSelected ? "bg-slate-50/80" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-7 rounded-md flex items-center justify-center text-xs font-semibold transition ${
                        isSelected 
                          ? "bg-slate-900 text-white" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {isSelected ? selIndex : person.charAt(0)}
                      </div>
                      <span className={`text-sm ${
                        isSelected ? "font-semibold text-slate-900" : "font-normal text-slate-700"
                      }`}>
                        {person}
                      </span>
                    </div>

                    <div className={`size-5 rounded-md flex items-center justify-center border transition ${
                      isSelected 
                        ? "bg-slate-900 border-slate-900 text-white" 
                        : "border-slate-300 bg-white"
                    }`}>
                      {isSelected && <Check className="size-3.5 stroke-[2.5]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Listede Olmayan Kişi Ekle */}
            <form onSubmit={handleAddCustomPerson} className="pt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Listede olmayan personel ekle..."
                  className="bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl flex-1 focus:outline-none focus:border-slate-400 transition"
                />
                <button
                  type="submit"
                  disabled={!newPersonName.trim()}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            ADIM 2: GÖREVLER
        ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Wrench className="size-4 text-slate-700" />
                Görev Dağılımı
              </h2>
              <p className="text-xs text-slate-500">Her personelin yapacağı görevi seçin</p>
            </div>

            <div className="space-y-2.5">
              {selectedPersons.map((person, idx) => {
                const currentTask = personTasks[person] || "";
                return (
                  <div 
                    key={person} 
                    className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-5 rounded bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{person}</span>
                      </div>
                      {currentTask && (
                        <span className="text-[11px] font-medium bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {currentTask}
                        </span>
                      )}
                    </div>

                    {/* Hızlı Görev Seçimi */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TASKS.map((task) => (
                        <button
                          key={task}
                          type="button"
                          onClick={() => handleSetTask(person, task)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            currentTask === task
                              ? "bg-slate-900 text-white font-medium"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {task}
                        </button>
                      ))}
                    </div>

                    {/* Özel Görev Girişi */}
                    <input
                      type="text"
                      value={currentTask}
                      onChange={(e) => handleSetTask(person, e.target.value)}
                      placeholder="veya özel görev yazın..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            ADIM 3: ÇALIŞMA ALANLARI
        ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="size-4 text-slate-700" />
                  Çalışma Alanları
                </h2>
                <p className="text-xs text-slate-500">Alanı yazıp çalışanları eşleyin</p>
              </div>

              <button
                type="button"
                onClick={addWorkArea}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition"
              >
                <Plus className="size-3.5" />
                Alan Ekle
              </button>
            </div>

            <div className="space-y-3">
              {workAreas.map((area, areaIdx) => (
                <div 
                  key={area.id}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {areaIdx + 1}. Alan
                    </span>
                    {workAreas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWorkArea(area.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Alan İsmi */}
                  <input
                    type="text"
                    value={area.name}
                    onChange={(e) => updateWorkAreaName(area.id, e.target.value)}
                    placeholder="Örn: Karkas Sahası, İzolasyon Bölümü, 1. Kat..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition"
                  />

                  {/* Hızlı Öneriler */}
                  <div className="flex flex-wrap gap-1">
                    {QUICK_AREAS.map((suggested) => (
                      <button
                        key={suggested}
                        type="button"
                        onClick={() => updateWorkAreaName(area.id, suggested)}
                        className={`text-[11px] px-2 py-0.5 rounded transition ${
                          area.name === suggested
                            ? "bg-slate-900 text-white font-medium"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {suggested}
                      </button>
                    ))}
                  </div>

                  {/* Personeller */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Bu Alanda Çalışanlar:</span>
                      <span className="font-semibold text-slate-800">{area.assignedPersons.length} kişi</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedPersons.map((person) => {
                        const isInThisArea = area.assignedPersons.includes(person);
                        return (
                          <button
                            key={person}
                            type="button"
                            onClick={() => togglePersonInArea(area.id, person)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                              isInThisArea
                                ? "bg-slate-900 border-slate-900 text-white font-medium shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{person}</span>
                            {isInThisArea && <Check className="size-3 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            ADIM 4: ÖZET VE MAİL İLE GÖNDERME
        ======================================================== */}
        {currentStep === 4 && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ClipboardCheck className="size-4 text-slate-700" />
                Tevzi Listesi Özeti
              </h2>
              <p className="text-xs text-slate-500">
                PDF dosyanız hazırlandı. Aşağıdan doğrudan Gmail/Mail ile gönderebilirsiniz.
              </p>
            </div>

            {/* Gönderilecek Mail Adresi Kartı */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="size-3.5 text-slate-500" />
                Alıcı E-posta Adresi
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="edgetr55@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition"
              />
            </div>

            {templateNotFound && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertCircle className="size-4 text-amber-600" />
                  PDF Şablonu Bulunamadı
                </div>
                <p className="text-amber-700">
                  <code>public/hilal-tevzi-sablon.pdf</code> dosyası bulunamadı. Şablonunuzu aşağıdan seçebilirsiniz:
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleManualPdfUpload}
                  accept=".pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white border border-amber-300 text-amber-900 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-100/50 transition"
                >
                  {customPdfFile ? customPdfFile.name : "PDF Şablonunu Seç"}
                </button>
              </div>
            )}

            {/* Sade Tablo / Liste Özeti */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-xs">
              <div className="bg-slate-50 px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 border-b border-slate-200">
                <span>Tarih: <strong className="text-slate-900">{docDate}</strong></span>
                <span>{selectedPersons.length} Kişi</span>
              </div>

              {selectedPersons.map((person, idx) => {
                const task = personTasks[person] || "—";
                const area = getPersonArea(person) || "—";
                return (
                  <div key={person} className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-5 rounded bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{person}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Görevi:</span>
                        <span className="text-slate-800 font-medium truncate block">{task}</span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Çalışma Alanı:</span>
                        <span className="text-slate-800 font-medium truncate block">{area}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ek Dosya & İndirme Seçeneği */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div className="text-xs text-slate-600">
                PDF: <strong className="text-slate-900 font-mono">Hilal {docDate}.pdf</strong>
              </div>
              <button
                type="button"
                onClick={handleOnlyDownload}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 underline underline-offset-2"
              >
                <FileDown className="size-3.5" />
                Dosyayı İndir
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={goToPrevStep}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium h-11 px-4 rounded-xl active:scale-95 transition flex items-center gap-1"
            >
              <ArrowLeft className="size-3.5" />
              Geri
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-11 rounded-xl shadow-xs active:scale-98 transition flex items-center justify-center gap-1.5"
            >
              <span>Sonraki Adım</span>
              <ArrowRight className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendViaEmailApp}
              disabled={selectedPersons.length === 0}
              className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold h-11 rounded-xl shadow-sm active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="size-4" />
              <span>Gmail / Mail ile Gönder</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
