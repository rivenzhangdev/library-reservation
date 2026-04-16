import * as dayjsImport from 'dayjs';

const dayjs = (dayjsImport as any).default || dayjsImport;

export function formatDateTime(value?: any, format = 'YYYY-MM-DD HH:mm'): string {
  if (value === undefined || value === null || value === '') return '';
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
