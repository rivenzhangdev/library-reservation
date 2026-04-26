import { t } from './i18n';

export interface TimeSlotConfigItem {
  slot: number;
  label: string;
  startTime: string;
  endTime: string;
  value: string;
  enabled: boolean;
  sortOrder: number;
}

export interface TimePeriodItem {
  value: string;
  label: string;
  start: string;
  end: string;
}

export function parseClockToMinutes(value: unknown) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return hours * 60 + minutes;
}

export function getFallbackTimeSlotConfigs(): TimeSlotConfigItem[] {
  return [
    {
      slot: 0,
      label: t('reservation.time.period.morning'),
      startTime: '08:00',
      endTime: '12:00',
      value: 'morning',
      enabled: true,
      sortOrder: 0,
    },
    {
      slot: 1,
      label: t('reservation.time.period.afternoon'),
      startTime: '13:00',
      endTime: '17:00',
      value: 'afternoon',
      enabled: true,
      sortOrder: 1,
    },
    {
      slot: 2,
      label: t('reservation.time.period.evening'),
      startTime: '18:00',
      endTime: '22:00',
      value: 'evening',
      enabled: true,
      sortOrder: 2,
    },
  ];
}

export function buildTimeSlotConfigs(rawList: any[]): TimeSlotConfigItem[] {
  const list = Array.isArray(rawList) ? rawList : [];

  return list
    .map((item: any) => {
      const slot = Number(item?.timeSlot);
      if (!Number.isInteger(slot) || slot < 0 || item?.enabled === false) return null;
      const label = String(item?.label || '').trim();
      const startTime = String(item?.startTime || item?.start || '').trim();
      const endTime = String(item?.endTime || item?.end || '').trim();
      const startText = startTime.length >= 5 ? startTime.slice(0, 5) : startTime;
      const endText = endTime.length >= 5 ? endTime.slice(0, 5) : endTime;
      const rangeText = startText && endText ? `${startText} - ${endText}` : '';
      return {
        slot,
        label: [label, rangeText].filter(Boolean).join(' ') || String(slot),
        startTime,
        endTime,
        value: String(item?.value || item?.key || slot).trim() || String(slot),
        enabled: item?.enabled !== false,
        sortOrder: Number(item?.order ?? Number.MAX_SAFE_INTEGER),
      } as TimeSlotConfigItem;
    })
    .filter(Boolean)
    .sort((a: TimeSlotConfigItem, b: TimeSlotConfigItem) => {
      const startDiff = parseClockToMinutes(a.startTime) - parseClockToMinutes(b.startTime);
      if (startDiff !== 0) return startDiff;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.slot - b.slot;
    });
}

export function getEnabledChronologicalTimeSlots(rawOrConfigs: any[]): TimeSlotConfigItem[] {
  const configs = buildTimeSlotConfigs(rawOrConfigs);
  if (configs.length > 0) {
    return configs.filter((item) => item.enabled !== false);
  }
  return getFallbackTimeSlotConfigs();
}

export function buildTimeSlotNameMap(configs: Array<{ slot: number; label: string }>) {
  return configs.reduce((acc: Record<number, string>, item) => {
    acc[item.slot] = item.label;
    return acc;
  }, {});
}

export function getTimeSlotLabel(slot: number, configs: Array<{ slot: number; label: string }>) {
  const map = buildTimeSlotNameMap(
    Array.isArray(configs) && configs.length > 0 ? configs : getFallbackTimeSlotConfigs()
  );
  return map[slot] || String(slot);
}

export function getCurrentTimeSlotLabel(currentSlot: number, rawOrConfigs: any[]) {
  const configs = getEnabledChronologicalTimeSlots(rawOrConfigs);
  const matched = configs.find((item) => Number(item.slot) === Number(currentSlot));
  return String(matched?.label || '').trim() || String(currentSlot);
}

export function toTimePeriods(rawOrConfigs: any[]): TimePeriodItem[] {
  return getEnabledChronologicalTimeSlots(rawOrConfigs).map((item) => ({
    value: item.value,
    label: item.label,
    start: item.startTime,
    end: item.endTime,
  }));
}
