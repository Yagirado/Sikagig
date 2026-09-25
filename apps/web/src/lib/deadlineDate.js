export function dateToSelection(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return { year, month: String(Number(month)), day: String(Number(day)) };
}

export function selectionToDate({ year, month, day }) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function clampDeadlineDate(value, today = new Date()) {
  const currentYear = today.getFullYear();
  const year = Math.max(currentYear, Math.min(Number(value.year), currentYear + 5));

  // Tentukan batas hari dalam bulan terpilih
  const maxDay = new Date(year, Number(value.month), 0).getDate();
  const month = Math.max(1, Math.min(Number(value.month), 12));
  const day = Math.max(1, Math.min(Number(value.day), maxDay));

  return { year: String(year), month: String(month), day: String(day) };
}
