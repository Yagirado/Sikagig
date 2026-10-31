export const FIRST_BIRTH_YEAR = 1970;

export function dateToSelection(value) {
  const [year, month, day] = value.split('-');
  return { year, month: String(Number(month)), day: String(Number(day)) };
}

export function selectionToDate({ year, month, day }) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function clampBirthDate(value, today = new Date()) {
  const year = Math.max(FIRST_BIRTH_YEAR, Math.min(Number(value.year), today.getFullYear()));
  const lastMonth = year === today.getFullYear() ? today.getMonth() + 1 : 12;
  const month = Math.max(1, Math.min(Number(value.month), lastMonth));
  const lastDay = year === today.getFullYear() && month === today.getMonth() + 1
    ? today.getDate()
    : new Date(year, month, 0).getDate();
  const day = Math.max(1, Math.min(Number(value.day), lastDay));
  return { year: String(year), month: String(month), day: String(day) };
}

export function birthDateError(value, today = new Date()) {
  if (!value) return 'Tanggal lahir wajib diisi.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Gunakan format YYYY-MM-DD.';
  const selection = dateToSelection(value);
  if (selectionToDate(clampBirthDate(selection, today)) !== value) {
    return 'Pilih tanggal yang valid, mulai tahun 1970 sampai hari ini.';
  }
  return '';
}
