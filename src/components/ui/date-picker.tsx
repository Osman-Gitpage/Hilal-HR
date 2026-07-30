"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string | Date;
  onChange?: (dateString: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
}

/**
 * Esnek tarih ayrıştırma: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD formatlarını destekler.
 */
function parseFlexibleDate(str: string): { iso: string; date: Date } | null {
  if (!str || !str.trim()) return null;
  const s = str.trim();

  // 1. DD.MM.YYYY veya DD/MM/YYYY veya DD-MM-YYYY
  const trMatch = s.match(/^(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})$/);
  if (trMatch) {
    const day = parseInt(trMatch[1], 10);
    const month = parseInt(trMatch[2], 10) - 1;
    const year = parseInt(trMatch[3], 10);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day && isValid(d)) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { iso, date: d };
    }
  }

  // 2. YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})[\.\/\-](\d{1,2})[\.\/\-](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day && isValid(d)) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { iso, date: d };
    }
  }

  return null;
}

/**
 * Otomatik nokta ekleme maskesi (GG.AA.YYYY):
 * 25 yazınca -> 25.
 * 2505 yazınca -> 25.05.
 * 25052026 yazınca -> 25.05.2026
 */
function formatDateInputMask(val: string, prevVal: string): string {
  if (val.length < prevVal.length) {
    if (prevVal.endsWith(".") && !val.endsWith(".")) {
      const raw = val.replace(/\D/g, "").slice(0, -1);
      return formatRawDigits(raw);
    }
    return val;
  }

  const raw = val.replace(/\D/g, "");
  return formatRawDigits(raw);
}

function formatRawDigits(raw: string): string {
  const digits = raw.slice(0, 8);
  if (digits.length <= 2) {
    return digits.length === 2 ? `${digits}.` : digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}${digits.length === 4 ? "." : ""}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "GG.AA.YYYY (Örn: 25.05.2026)",
  disabled = false,
  className,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Seçili Date nesnesi
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isValid(value) ? value : undefined;
    try {
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [value]);

  // Input içindeki metin gösterimi (GG.AA.YYYY)
  const [inputText, setInputText] = React.useState<string>(() => {
    if (!selectedDate) return "";
    return format(selectedDate, "dd.MM.yyyy");
  });

  // External value değiştiğinde inputText'i güncelle
  React.useEffect(() => {
    if (!selectedDate) {
      setInputText("");
    } else {
      setInputText(format(selectedDate, "dd.MM.yyyy"));
    }
  }, [selectedDate]);

  // Manuel metin girişi değiştiğinde (Otomatik Nokta Maskeli)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const maskedVal = formatDateInputMask(rawVal, inputText);
    setInputText(maskedVal);

    if (!maskedVal.trim()) {
      onChange?.("");
      return;
    }

    const parsed = parseFlexibleDate(maskedVal);
    if (parsed) {
      onChange?.(parsed.iso);
    }
  };

  // Input odak kaybettiğinde (blur) geçersiz tarihse temizle/düzelt
  const handleInputBlur = () => {
    if (!inputText.trim()) {
      onChange?.("");
      return;
    }
    const parsed = parseFlexibleDate(inputText);
    if (parsed) {
      setInputText(format(parsed.date, "dd.MM.yyyy"));
      onChange?.(parsed.iso);
    } else if (selectedDate) {
      setInputText(format(selectedDate, "dd.MM.yyyy"));
    } else {
      setInputText("");
      onChange?.("");
    }
  };

  // Takvimden gün seçildiğinde
  const handleCalendarSelect = (date?: Date) => {
    if (!date) {
      setInputText("");
      onChange?.("");
    } else {
      const iso = format(date, "yyyy-MM-dd");
      setInputText(format(date, "dd.MM.yyyy"));
      onChange?.(iso);
    }
    setOpen(false);
  };

  // Temizle ikonu
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputText("");
    onChange?.("");
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full text-xs h-9 pl-3 pr-14 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus-visible:ring-1 focus-visible:ring-[#7c3aed]"
      />

      <div className="absolute right-1.5 flex items-center gap-0.5 z-10">
        {clearable && inputText && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Temizle"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            disabled={disabled}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-[#7c3aed] hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
            title="Takvimi Aç"
          >
            <CalendarIcon className="w-4 h-4 text-[#7c3aed]" />
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-[9999]"
            align="end"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              locale={tr}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
