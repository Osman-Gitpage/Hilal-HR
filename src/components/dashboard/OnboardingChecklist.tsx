"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CheckItem = {
  id: string;
  label: string;
  desc: string;
  done: boolean;
  href?: string;
};

interface Props {
  items: CheckItem[];
  sirketId: string;
}

export function OnboardingChecklist({ items, sirketId }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;
  const pct = Math.round((doneCount / items.length) * 100);

  useEffect(() => {
    // Tümü tamamlandıysa veya kullanıcı kapattıysa gösterme
    const key = `hilal-ik-checklist-dismissed-${sirketId}`;
    const isDismissed = localStorage.getItem(key) === "true";
    setDismissed(isDismissed);
    setVisible(!allDone && !isDismissed);
  }, [allDone, sirketId]);

  const dismiss = () => {
    const key = `hilal-ik-checklist-dismissed-${sirketId}`;
    localStorage.setItem(key, "true");
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || dismissed) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Başlangıç Rehberi</span>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-medium">
              {doneCount}/{items.length} tamamlandı
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sistemi verimli kullanmak için bu adımları tamamlayın.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
          aria-label="Kapat"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 group">
            {/* Checkbox */}
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${
                item.done
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5 3.5-3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${item.done ? "line-through text-muted-foreground" : ""}`}>
                {item.label}
              </span>
              {!item.done && (
                <span className="text-xs text-muted-foreground ml-2">{item.desc}</span>
              )}
            </div>

            {/* Action link */}
            {!item.done && item.href && (
              <Link
                href={item.href}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                Git →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
