import * as dayjsImport from 'dayjs';

const dayjs = (dayjsImport as any).default || dayjsImport;

const NORMALIZED_DATETIME = /^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2})(?::\d{2})?$/;
const NORMALIZED_DATE = /^\d{4}-\d{2}-\d{2}$/;

function formatNormalizedString(value: string, format: string): string | undefined {
  const raw = value.trim();
  const datetimeMatch = raw.match(NORMALIZED_DATETIME);

  if (datetimeMatch) {
    const datePart = datetimeMatch[1];
    const timePart = datetimeMatch[2];
    if (format === 'YYYY-MM-DD HH:mm') return `${datePart} ${timePart}`;
    if (format === 'YYYY-MM-DD HH:mm:ss') return `${datePart} ${timePart}:00`;
    if (format === 'YYYY-MM-DD') return datePart;
    if (format === 'MM-DD HH:mm') return `${datePart.slice(5)} ${timePart}`;
    return undefined;
  }

  if (NORMALIZED_DATE.test(raw)) {
    if (format === 'YYYY-MM-DD') return raw;
    if (format === 'YYYY-MM-DD HH:mm') return `${raw} 00:00`;
    if (format === 'YYYY-MM-DD HH:mm:ss') return `${raw} 00:00:00`;
    if (format === 'MM-DD HH:mm') return `${raw.slice(5)} 00:00`;
  }

  return undefined;
}

export function formatDateTime(value?: any, format = 'YYYY-MM-DD HH:mm'): string {
  if (value === undefined || value === null || value === '') return '';

  if (typeof value === 'string') {
    const normalized = formatNormalizedString(value, format);
    if (normalized !== undefined) {
      return normalized;
    }
  }

  const date = dayjs(value);
  return date.isValid() ? date.format(format) : String(value);
}

export function formatMonthDayTime(value?: any): string {
  return formatDateTime(value, 'MM-DD HH:mm');
}

export function getToday(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function getCurrentTimeSlot(): number {
  const hour = dayjs().hour();
  if (hour >= 18) return 2;
  if (hour >= 13) return 1;
  return 0;
}

export function toTimestamp(value?: any): number {
  const date = dayjs(value);
  return date.isValid() ? date.valueOf() : 0;
}

export function toTimeMinutes(time = '00:00'): number {
  const [hour, minute] = String(time)
    .split(':')
    .map((part) => Number(part) || 0);
  return hour * 60 + minute;
}

export function getCurrentTimeMinutes(): number {
  return dayjs().hour() * 60 + dayjs().minute();
}
