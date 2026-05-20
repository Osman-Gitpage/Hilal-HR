/**
 * Ortak tablo sıralama yardımcıları
 */

export type SortDir = "asc" | "desc";

export interface SortState<T extends string> {
  field: T | null;
  dir: SortDir;
}

/** Bir sütuna tıklandığında yeni sort state'ini döner */
export function nextSort<T extends string>(
  current: SortState<T>,
  clicked: T
): SortState<T> {
  if (current.field !== clicked) return { field: clicked, dir: "asc" };
  if (current.dir === "asc") return { field: clicked, dir: "desc" };
  return { field: null, dir: "asc" }; // 3. tıkta sıralamayı kaldır
}

/** Genel amaçlı karşılaştırıcı — string, number, null destekler */
export function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  // null/undefined her zaman sona
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  const mul = dir === "asc" ? 1 : -1;

  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * mul;
  }

  const sa = String(a).toLocaleLowerCase("tr");
  const sb = String(b).toLocaleLowerCase("tr");
  return sa.localeCompare(sb, "tr") * mul;
}
