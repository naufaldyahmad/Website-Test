/**
 * Utilitas Tanggal & Waktu Khusus Zona WITA (Asia/Makassar, UTC+8)
 * Pelabuhan Nusantara Parepare - PT Pelindo
 */

export const TIMEZONE_WITA = 'Asia/Makassar';
export const WITA_OFFSET_HOURS = 8;

export const ALL_DAYS = [
  { index: 0, name: 'Minggu', shortName: 'Min', upper: 'MINGGU' },
  { index: 1, name: 'Senin', shortName: 'Sen', upper: 'SENIN' },
  { index: 2, name: 'Selasa', shortName: 'Sel', upper: 'SELASA' },
  { index: 3, name: 'Rabu', shortName: 'Rab', upper: 'RABU' },
  { index: 4, name: 'Kamis', shortName: 'Kam', upper: 'KAMIS' },
  { index: 5, name: 'Jumat', shortName: 'Jum', upper: 'JUMAT' },
  { index: 6, name: 'Sabtu', shortName: 'Sab', upper: 'SABTU' },
];

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_NAMES_UPPER = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

/**
 * Mendapatkan urutan 7 hari berdasarkan konfigurasi hari pertama minggu
 */
export function getWeekDaysOrder(firstDay: number = 1) {
  const result = [];
  for (let i = 0; i < 7; i++) {
    const dayIndex = (firstDay + i) % 7;
    result.push(ALL_DAYS[dayIndex]);
  }
  return result;
}

/**
 * Membuat objek Date dari komponen tanggal dalam zona waktu WITA (UTC+8)
 */
export function createWitaDate(year: number, month: number, day: number, hours: number = 0, minutes: number = 0, seconds: number = 0, ms: number = 0): Date {
  // month is 0-indexed
  return new Date(Date.UTC(year, month, day, hours - WITA_OFFSET_HOURS, minutes, seconds, ms));
}

/**
 * Mendapatkan komponen waktu WITA dari Date object
 */
export function getWitaComponents(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Geser dengan offset WITA
  const witaTime = d.getTime() + WITA_OFFSET_HOURS * 3600000;
  const witaDate = new Date(witaTime);
  return {
    year: witaDate.getUTCFullYear(),
    month: witaDate.getUTCMonth(),
    date: witaDate.getUTCDate(),
    day: witaDate.getUTCDay(), // 0 = Minggu, 1 = Senin, ...
    hours: witaDate.getUTCHours(),
    minutes: witaDate.getUTCMinutes(),
    seconds: witaDate.getUTCSeconds(),
  };
}

/**
 * Menghitung batas awal (00:00:00 WITA) dan akhir (23:59:59.999 WITA) untuk minggu tertentu
 */
export function getWeekBounds(year: number, weekNumber: number, firstDay: number = 1) {
  // Referensi: 4 Januari selalu berada di minggu ke-1 kalender ISO
  // Cari tanggal awal minggu pertama tahun tersebut
  const jan4Wita = createWitaDate(year, 0, 4, 0, 0, 0);
  const jan4Day = getWitaComponents(jan4Wita).day;
  
  // Hitung selisih hari dari jan4 ke hari pertama minggu (firstDay)
  let diff = jan4Day - firstDay;
  if (diff < 0) diff += 7;
  
  const week1StartTime = jan4Wita.getTime() - diff * 86400000;
  const targetStartTime = week1StartTime + (weekNumber - 1) * 7 * 86400000;
  
  const startWita = new Date(targetStartTime);
  const endWita = new Date(targetStartTime + (7 * 86400000) - 1); // 6 hari 23:59:59.999 kemudian
  
  return {
    startDate: startWita,
    endDate: endWita,
  };
}

/**
 * Menghitung nomor minggu dan tahun untuk suatu tanggal berdasarkan hari pertama minggu
 */
export function getWeekInfoFromDate(date: Date | string, firstDay: number = 1): { year: number; weekNumber: number } {
  const d = typeof date === 'string' ? new Date(date) : date;
  const wita = getWitaComponents(d);
  
  // Cari awal minggu ini
  let diff = wita.day - firstDay;
  if (diff < 0) diff += 7;
  
  const thisWeekStart = createWitaDate(wita.year, wita.month, wita.date - diff, 0, 0, 0);
  
  // Tengah minggu (hari ke-4) menentukan tahun kalender minggu tersebut
  const midWeek = new Date(thisWeekStart.getTime() + 3 * 86400000);
  const midWita = getWitaComponents(midWeek);
  const targetYear = midWita.year;
  
  // Cari awal minggu ke-1 di targetYear
  const jan4Wita = createWitaDate(targetYear, 0, 4, 0, 0, 0);
  const jan4Day = getWitaComponents(jan4Wita).day;
  let diffJan4 = jan4Day - firstDay;
  if (diffJan4 < 0) diffJan4 += 7;
  const week1Start = jan4Wita.getTime() - diffJan4 * 86400000;
  
  const weekNumber = Math.floor((thisWeekStart.getTime() - week1Start) / (7 * 86400000)) + 1;
  
  return {
    year: targetYear,
    weekNumber: Math.max(1, weekNumber),
  };
}

export function getCurrentIsoWeek(firstDay: number = 1): { year: number; weekNumber: number } {
  return getWeekInfoFromDate(new Date(), firstDay);
}

export interface MonthWeekItem {
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  label: string;
  rangeLabel: string;
  isCrossingMonth: boolean;
}

/**
 * Mendapatkan daftar minggu untuk navigasi bulan horizontal.
 * Setiap minggu yang memiliki setidaknya satu hari di bulan tersebut akan disertakan.
 */
export function getWeeksForMonth(year: number, month: number, firstDay: number = 1): MonthWeekItem[] {
  // Tanggal awal dan akhir bulan dalam WITA
  const firstDayOfMonth = createWitaDate(year, month, 1, 0, 0, 0);
  // Tanggal terakhir bulan (hari ke-0 dari bulan berikutnya)
  const lastDayOfMonth = createWitaDate(year, month + 1, 0, 23, 59, 59);
  
  const weeks: MonthWeekItem[] = [];
  const processedWeeks = new Set<string>();
  
  // Iterasi per 3 hari dari awal hingga akhir bulan untuk menangkap setiap minggu
  let currentCursor = new Date(firstDayOfMonth);
  while (currentCursor.getTime() <= lastDayOfMonth.getTime() + 86400000) {
    const info = getWeekInfoFromDate(currentCursor, firstDay);
    const key = `${info.year}-${info.weekNumber}`;
    
    if (!processedWeeks.has(key)) {
      processedWeeks.add(key);
      const bounds = getWeekBounds(info.year, info.weekNumber, firstDay);
      
      const startComp = getWitaComponents(bounds.startDate);
      const endComp = getWitaComponents(bounds.endDate);
      const isCrossingMonth = startComp.month !== endComp.month;
      
      const startMonthName = MONTH_NAMES_ID[startComp.month].slice(0, 3);
      const endMonthName = MONTH_NAMES_ID[endComp.month].slice(0, 3);
      
      const rangeLabel = isCrossingMonth
        ? `${String(startComp.date).padStart(2, '0')} ${startMonthName} – ${String(endComp.date).padStart(2, '0')} ${endMonthName} ${endComp.year}`
        : `${String(startComp.date).padStart(2, '0')} – ${String(endComp.date).padStart(2, '0')} ${MONTH_NAMES_ID[startComp.month]} ${startComp.year}`;
        
      weeks.push({
        weekNumber: info.weekNumber,
        year: info.year,
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        label: `Minggu ke-${info.weekNumber}`,
        rangeLabel,
        isCrossingMonth,
      });
    }
    
    // Geser 3 hari
    currentCursor = new Date(currentCursor.getTime() + 3 * 86400000);
  }
  
  // Sort by start date
  weeks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  return weeks;
}

export function formatWitaDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE_WITA,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d) + ' WITA';
}

export function formatWitaDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE_WITA,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatWitaTimeOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE_WITA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Format Date object untuk value HTML datetime-local input
 */
export function formatDateTimeLocalInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const wita = getWitaComponents(d);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${wita.year}-${pad(wita.month + 1)}-${pad(wita.date)}T${pad(wita.hours)}:${pad(wita.minutes)}`;
}

/**
 * Mengonversi string input datetime-local menjadi Date object yang merepresentasikan waktu WITA
 */
export function parseDateTimeLocalInput(inputStr: string): Date {
  const [datePart, timePart] = inputStr.split('T');
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const [hoursStr, minutesStr] = timePart.split(':');
  
  const y = parseInt(yearStr);
  const m = parseInt(monthStr) - 1;
  const d = parseInt(dayStr);
  const h = parseInt(hoursStr);
  const min = parseInt(minutesStr);
  
  return createWitaDate(y, m, d, h, min, 0);
}
