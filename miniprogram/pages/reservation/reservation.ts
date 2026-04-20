import { getFloors, getFloorSeats, getSeatZones } from '../../apis/seats';
import { createBooking } from '../../apis/booking';
import { getWechatTemplateIds } from '../../apis/notification';
import {
  getBookingRules,
  getSeatFacilityConfigs,
  getSeatTypeConfigs,
  getTimeSlotConfigs,
} from '../../apis/config';
import { ensureBoundStudentInfo, isLogin } from '../../utils/auth';
import { consumePendingReservationParams } from '../../utils/reservationNavigator';
import {
  formatDateTime,
  getCurrentTimeMinutes,
  getToday,
  toTimestamp,
  toTimeMinutes,
} from '../../utils/time';
import { sortByFloorName, sortBySeatPosition } from '../../utils/sort';

const MIN_CUSTOM_TIME_MINUTES = 30;
const CHECKIN_WINDOW_MINUTES = 15;

async function requestBookingSubscribeMessage(templateId: string) {
  if (!templateId) return null;

  return new Promise<Record<string, string> | null>((resolve) => {
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success(res) {
        resolve(res as any);
      },
      fail(err) {
        console.warn('requestSubscribeMessage failed', err);
        resolve(null);
      },
      complete() {
        // no-op
      },
    });
  });
}

function normalizeConfigText(value: any) {
  return String(value ?? '').trim();
}

function resolveFacilityFieldByKey(rawKey: any) {
  const key = normalizeConfigText(rawKey).toLowerCase();
  if (!key) return '';
  if (['power', 'socket', 'hassocket', 'has_socket'].includes(key)) return 'hasSocket';
  if (['window', 'iswindow', 'is_window'].includes(key)) return 'isWindow';
  return '';
}

function resolveSeatFacilityFlag(seat: any, facilityKey: string) {
  const field = resolveFacilityFieldByKey(facilityKey);
  if (field) {
    return Boolean(seat?.[field]);
  }
  return Boolean(seat?.[facilityKey]);
}

function resolveSeatTypeValue(rawType: any, seatTypeValueByCode: Record<string, string>) {
  const typeKey = normalizeConfigText(rawType);
  if (!typeKey) return '';
  const numericKey = String(Number(typeKey));
  if (typeKey in seatTypeValueByCode) {
    return seatTypeValueByCode[typeKey];
  }
  if (numericKey !== 'NaN' && numericKey in seatTypeValueByCode) {
    return seatTypeValueByCode[numericKey];
  }
  return typeKey;
}

function resolveSeatTypeLabel(
  rawType: any,
  typeValue: string,
  seatTypeLabelByValue: Record<string, string>,
  explicitLabel?: any
) {
  const label = normalizeConfigText(explicitLabel);
  if (label) return label;
  if (typeValue && seatTypeLabelByValue[typeValue]) {
    return seatTypeLabelByValue[typeValue];
  }
  return typeValue || normalizeConfigText(rawType);
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 楼层数据（初始为空，在 initFloorData 中初始化）
    floors: [] as Array<{ id: number; name: string }>,
    currentFloor: 0,

    // 搜索
    searchValue: '',

    // 筛选面板
    showFilterPanel: false,

    // 筛选面板文案
    filterConditionsText: '',
    filterAreaText: '',
    filterSeatTypeText: '',
    filterFacilityText: '',
    filterFacilityPowerText: '',
    filterFacilityWindowText: '',
    filterResetText: '',
    filterResultText: '',
    noSeatText: '',

    // 区域选项（初始为空，在 initAreaData 中初始化）
    areas: [] as Array<{ id: string; name: string }>,
    selectedArea: { id: 'all', name: '' },

    // 座位类型选项（初始为空，在 initSeatTypeData 中初始化）
    seatTypes: [] as Array<{ id: string; name: string }>,
    selectedSeatType: { id: 'all', name: '' },

    // 设施选项
    facilities: {
      power: false,
      window: false,
    } as Record<string, boolean> & { power: boolean; window: boolean },

    // 座位数据
    seats: [] as any[],
    selectedSeatIds: [] as string[],

    // 主题
    theme: 'light',

    // 时间选择
    selectedDate: '',
    currentTimePeriod: 'morning',
    selectedTimeSlot: 'morning',
    currentDuration: '2h',
    timePeriods: [] as Array<{
      label: string;
      value: string;
      start: string;
      end: string;
      timeSlot?: number;
      disabled?: boolean;
    }>,
    timeSlotConfigs: [] as Array<{
      label: string;
      value: string;
      start: string;
      end: string;
      timeSlot: number;
      enabled: boolean;
    }>,
    seatTypeConfigs: [] as Array<{
      id?: number;
      type: number;
      value: string;
      label: string;
      enabled: boolean;
    }>,
    seatTypeValueByCode: {} as Record<string, string>,
    seatTypeLabelByValue: {} as Record<string, string>,
    seatFacilityConfigs: [] as Array<{ id?: number; key: string; label: string; enabled: boolean }>,
    facilityOptions: [] as Array<{ key: string; label: string; enabled: boolean }>,
    durations: [] as Array<{ label: string; value: string }>,

    // 自定义时间段
    showCustomTime: false,
    useCustomTime: false,
    showDatetimePicker: false,
    datetimePickerField: '',
    datetimePickerType: 'date',
    datetimePickerValue: 0 as number | string,
    startTime: '08:00',
    endTime: '12:00',
    customStartTime: '',
    customEndTime: '',
    customTimePeriodText: '',
    customTimeHintText: '',

    // 预约确认
    selectedSeatText: '',
    selectedSeatInfo: null as any,
    currentTimePeriodText: '',
    currentDurationText: '',
    reservationInfoItems: [] as Array<{ label: string; value: string; highlight?: boolean }>,
    datePickerMinTimestamp: toTimestamp(getToday()),

    // 加载状态
    seatsLoading: false,

    // 多语言支持
    languageClass: '',
    currentLang: 'zh' as 'zh' | 'en',
    navTitle: '',
    seatInfoPopoverStyle: '',
    popoverDirection: 'down' as 'down' | 'up',
    seatMapWrapperRect: null as any,

    // 多语言文案
    floorSelectText: '',
    timeSelectText: '',
    timePeriodText: '',
    timeDurationText: '',
    filterText: '',
    searchPlaceholderText: '',
    confirmTitleText: '',
    confirmButtonText: '',
    customTimeCancelText: '',
    customTimeConfirmText: '',
    timeRangeLabelText: '',
    customTimeStartText: '',
    customTimeEndText: '',
    seatCount: 0,
    minCustomTimeMinutes: MIN_CUSTOM_TIME_MINUTES,
    checkinWindowMinutes: CHECKIN_WINDOW_MINUTES,
  },

  pendingReservationParams: null as any,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
    // 获取全局 App 实例
    const app = getApp();

    // 初始化语言类名和导航栏标题
    this.setData({
      languageClass: app.globalData.languageClass || 'lang-zh',
      navTitle: app.t('reservation.title'),
    });

    // 初始化所有需要多语言的数据
    this.initFloorData();
    this.initAreaData();
    this.initSeatTypeData();
    this.initFilterTexts();

    const today = getToday();
    const pendingParams = consumePendingReservationParams();
    const optionDate = options && typeof options.date === 'string' ? options.date : '';
    const pendingDate =
      pendingParams && typeof pendingParams.date === 'string' ? pendingParams.date : '';
    const selectedDate = this.getValidReservationDate(optionDate || pendingDate || today);

    this.setData(
      {
        selectedDate,
      },
      () => {
        this.loadTimeSlotConfigs(selectedDate);
      }
    );

    // 处理页面参数
    if (options && Object.keys(options).length > 0) {
      this.handleFavoriteParams(options);
    }
    if (pendingParams && Object.keys(pendingParams).length > 0) {
      this.pendingReservationParams = pendingParams;
      this.handleFavoriteParams(pendingParams);
    }

    this.updateReservationInfo();
    this.loadSeatMapWrapperRect();
  },

  async loadSeatMapWrapperRect() {
    const query = wx.createSelectorQuery();
    query.select('#seatMapWrapper').boundingClientRect();
    query.exec((res: any[]) => {
      const rect = res && res[0] ? res[0] : null;
      if (rect) {
        this.setData({ seatMapWrapperRect: rect });
      }
    });
  },

  /**
   * 处理从收藏页面传递的参数
   */
  handleFavoriteParams(options: any) {
    console.log('handleFavoriteParams 接收到参数:', options);

    // 处理日期参数
    const today = getToday();
    const requestedDate = this.getValidReservationDate(
      options.date || this.data.selectedDate || today
    );
    if (requestedDate !== this.data.selectedDate) {
      this.setData({ selectedDate: requestedDate });
    }

    // 处理座位参数
    if (options.seatId) {
      const { seatId, seatName, seatCode, zone, floor, type, facilities } = options;

      console.log('接收到座位参数:', { seatId, seatName, seatCode, zone, floor, type, facilities });

      // 解析楼层
      if (floor) {
        const floorId = Number(String(floor).replace(/[^\d]/g, ''));
        if (!Number.isNaN(floorId) && floorId > 0) {
          this.setData({ currentFloor: floorId });
        }
      }

      // 解析区域（按后端返回的原始 zone 名称匹配，不做本地映射）
      if (zone) {
        const zoneName = String(zone).trim();
        if (zoneName) {
          const area =
            this.data.areas.find((a) => a.id === zoneName || a.name === zoneName) ||
            ({ id: zoneName, name: zoneName } as any);
          this.setData({ selectedArea: area });
        }
      }

      // 解析座位类型（优先 typeValue，其次匹配 id/name）
      const incomingTypeValue = normalizeConfigText((options as any).typeValue);
      const incomingTypeLabel = normalizeConfigText((options as any).typeLabel);
      const incomingTypeText = normalizeConfigText(type);
      if (incomingTypeValue || incomingTypeLabel || incomingTypeText) {
        const matchedSeatType = this.data.seatTypes.find((item) => {
          if (incomingTypeValue && item.id === incomingTypeValue) return true;
          if (
            incomingTypeText &&
            (item.id === incomingTypeText || item.name === incomingTypeText)
          ) {
            return true;
          }
          if (incomingTypeLabel && item.name === incomingTypeLabel) return true;
          return false;
        });

        const fallbackId = incomingTypeValue || incomingTypeText || incomingTypeLabel;
        this.setData({
          selectedSeatType:
            matchedSeatType ||
            ({
              id: fallbackId || 'all',
              name: incomingTypeLabel || incomingTypeText || fallbackId,
            } as any),
        });
      }

      // 解析设施（优先 facilityKeys，其次按 label 匹配）
      const rawFacilityKeys = normalizeConfigText((options as any).facilityKeys);
      const rawFacilityLabels = normalizeConfigText(facilities);
      const facilityTokens = (rawFacilityKeys || rawFacilityLabels)
        .split(',')
        .map((item) => String(item || '').trim())
        .filter(Boolean);

      if (facilityTokens.length > 0) {
        const nextFacilities = {
          power: false,
          window: false,
        } as Record<string, boolean> & { power: boolean; window: boolean };

        (this.data.facilityOptions || []).forEach((item: any) => {
          nextFacilities[item.key] = false;
        });

        if (!Object.prototype.hasOwnProperty.call(nextFacilities, 'power')) {
          nextFacilities.power = false;
        }
        if (!Object.prototype.hasOwnProperty.call(nextFacilities, 'window')) {
          nextFacilities.window = false;
        }

        const facilityConfigs = this.data.seatFacilityConfigs || [];

        facilityTokens.forEach((token) => {
          const normalizedToken = token.toLowerCase();

          if (['power', 'socket', 'hassocket', 'has_socket'].includes(normalizedToken)) {
            nextFacilities.power = true;
            return;
          }
          if (['window', 'iswindow', 'is_window'].includes(normalizedToken)) {
            nextFacilities.window = true;
            return;
          }

          const matchedOption = (this.data.facilityOptions || []).find(
            (item: any) =>
              String(item.key || '').toLowerCase() === normalizedToken ||
              String(item.label || '').toLowerCase() === normalizedToken
          );
          if (matchedOption) {
            nextFacilities[matchedOption.key] = true;
            return;
          }

          const matchedConfig = facilityConfigs.find(
            (item: any) =>
              String(item.key || '').toLowerCase() === normalizedToken ||
              String(item.label || '').toLowerCase() === normalizedToken
          );
          if (matchedConfig?.key) {
            nextFacilities[String(matchedConfig.key)] = true;
          }
        });

        this.setData({ facilities: nextFacilities });
      }

      // 自动选择座位
      if (seatId) {
        const seat = this.data.seats.find((s) => s.id === seatId || s.seatCode === seatCode);
        this.setData({
          selectedSeatIds: [String(seatId)],
          selectedSeatText: seatName || seat?.label || seat?.id || String(seatId),
        });
        if (seat) {
          this.updateReservationInfo();

          wx.showToast({
            title: `已自动选择：${seatName || seat?.label || seatId}`,
            icon: 'success',
            duration: 2000,
          });
        }
      }
    }

    // 处理时段参数
    if (options.startTime && options.endTime) {
      const { startTime, endTime, timeSlotName } = options;

      console.log('接收到时段参数:', { startTime, endTime, timeSlotName });

      const durationMinutes = toTimeMinutes(endTime) - toTimeMinutes(startTime);
      const durationText =
        this.formatDurationText(startTime, endTime) || `${Math.ceil(durationMinutes / 60)}h`;

      // 设置为自定义时间段
      this.setData({
        customStartTime: startTime,
        customEndTime: endTime,
        customTimePeriodText: `${startTime} - ${endTime}`,
        useCustomTime: true,
        currentTimePeriodText: `${startTime} - ${endTime}`,
        currentDurationText: durationText,
        showCustomTime: false,
      });

      console.log('设置后的数据:', {
        customStartTime: startTime,
        customEndTime: endTime,
        useCustomTime: true,
        currentDurationText: durationText,
      });

      // 更新预约信息列表
      this.updateReservationInfo();

      wx.showToast({
        title: `已设置时段：${startTime} - ${endTime}（${durationText}）`,
        icon: 'success',
        duration: 2000,
      });
    } else if (options.timeSlotId || options.timeSlotName) {
      const timePeriod = this.findTimePeriodByParams(options);
      if (timePeriod) {
        this.setData({
          useCustomTime: false,
          currentTimePeriod: timePeriod.value,
          selectedTimeSlot: timePeriod.value,
          currentTimePeriodText: timePeriod.label,
          customTimePeriodText: `${timePeriod.start} - ${timePeriod.end}`,
          showCustomTime: false,
        });
        this.updateReservationInfo();
      } else {
        this.pendingReservationParams = options;
      }
    }
  },

  applyPendingReservationParamsAfterLoad() {
    if (!this.pendingReservationParams) {
      return;
    }

    const options = this.pendingReservationParams;
    if (options.startTime && options.endTime) {
      this.pendingReservationParams = null;
      return;
    }

    if (options.timeSlotId || options.timeSlotName) {
      const timePeriod = this.findTimePeriodByParams(options);
      if (timePeriod) {
        this.setData({
          useCustomTime: false,
          currentTimePeriod: timePeriod.value,
          selectedTimeSlot: timePeriod.value,
          currentTimePeriodText: timePeriod.label,
          customTimePeriodText: `${timePeriod.start} - ${timePeriod.end}`,
          showCustomTime: false,
        });
        this.updateReservationInfo();
        this.pendingReservationParams = null;
      }
    }
  },

  findTimePeriodByParams(options: any) {
    const matchId = String(options.timeSlotId ?? '').trim();
    const matchName = String(options.timeSlotName ?? '').trim();
    return this.data.timePeriods.find((p) => {
      if (matchId && (p.value === matchId || String(p.timeSlot) === matchId)) {
        return true;
      }
      if (matchName && p.label === matchName) {
        return true;
      }
      return false;
    });
  },

  getTomorrow() {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  isSelectedDateExpired(date: string) {
    if (date !== getToday()) {
      return false;
    }
    const timePeriods = this.buildTimePeriods(date);
    return timePeriods.length > 0 && timePeriods.every((item) => item.disabled);
  },

  getValidReservationDate(date: any) {
    const today = getToday();
    if (!date || typeof date !== 'string') {
      return this.isSelectedDateExpired(today) ? this.getTomorrow() : today;
    }
    const normalized = date.trim();
    if (normalized < today) {
      return this.isSelectedDateExpired(today) ? this.getTomorrow() : today;
    }
    if (normalized === today && this.isSelectedDateExpired(today)) {
      return this.getTomorrow();
    }
    return normalized;
  },

  getSelectedSlotValue() {
    return this.data.useCustomTime ? this.data.selectedTimeSlot : this.data.currentTimePeriod;
  },

  getSelectedSlotRange() {
    const slotValue = this.getSelectedSlotValue();
    const period = this.data.timePeriods.find((p) => p.value === slotValue);
    if (period) {
      return { start: period.start, end: period.end };
    }
    return { start: '08:00', end: '12:00' };
  },

  formatDurationText(startTime: string, endTime: string) {
    const durationMinutes = toTimeMinutes(endTime) - toTimeMinutes(startTime);
    if (durationMinutes <= 0) {
      return '';
    }
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    if (this.data.currentLang === 'zh') {
      if (minutes === 0) {
        return `${hours} 小时`;
      }
      return `${hours} 小时 ${minutes} 分钟`;
    }
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  },

  getTodayTimeString() {
    return formatDateTime(new Date(), 'HH:mm');
  },

  getAutoStartTimeForRange(range: { start: string; end: string }) {
    if (!this.isSelectedDateToday()) {
      return range.start;
    }

    const nowTime = this.getTodayTimeString();
    if (nowTime > range.start && nowTime < range.end) {
      return nowTime;
    }
    return range.start;
  },

  getEffectiveBookingTimeRange() {
    if (this.data.useCustomTime) {
      return {
        startTime: this.data.customStartTime,
        endTime: this.data.customEndTime,
        autoAdjusted: false,
      };
    }

    const range = this.getSelectedSlotRange();
    const startTime = this.getAutoStartTimeForRange(range);
    return {
      startTime,
      endTime: range.end,
      autoAdjusted: startTime !== range.start,
    };
  },

  isSelectedDateToday() {
    return this.data.selectedDate === getToday();
  },

  /**
   * 初始化时段和时长选项
   */
  buildTimePeriods(selectedDate: string) {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);
    const today = getToday();
    const isToday = selectedDate === today;
    const currentMinutes = getCurrentTimeMinutes();

    const validConfigs = Array.isArray(this.data.timeSlotConfigs)
      ? this.data.timeSlotConfigs.filter(
          (item) =>
            item &&
            item.enabled !== false &&
            typeof item.label === 'string' &&
            typeof item.value === 'string' &&
            (typeof (item as any).startTime === 'string' || typeof item.start === 'string') &&
            (typeof (item as any).endTime === 'string' || typeof item.end === 'string')
        )
      : [];

    const fallbackConfigs = [
      {
        label: t('reservation.time.period.morning'),
        value: 'morning',
        start: '08:00',
        end: '12:00',
        timeSlot: 0,
        enabled: true,
      },
      {
        label: t('reservation.time.period.afternoon'),
        value: 'afternoon',
        start: '13:00',
        end: '17:00',
        timeSlot: 1,
        enabled: true,
      },
      {
        label: t('reservation.time.period.evening'),
        value: 'evening',
        start: '18:00',
        end: '22:00',
        timeSlot: 2,
        enabled: true,
      },
    ];

    const configSlots = validConfigs.length ? validConfigs : fallbackConfigs;

    return configSlots.map((slot) => {
      const startValue = (slot as any).startTime || slot.start || '';
      const endValue = (slot as any).endTime || slot.end || '';
      if (!isToday) {
        return {
          label: slot.label,
          value: slot.value,
          start: startValue,
          end: endValue,
          timeSlot: slot.timeSlot,
          disabled: false,
        };
      }
      const slotEndMinutes = toTimeMinutes(endValue);
      return {
        label: slot.label,
        value: slot.value,
        start: startValue,
        end: endValue,
        timeSlot: slot.timeSlot,
        disabled: currentMinutes >= slotEndMinutes,
      };
    });
  },

  refreshTimePeriods(selectedDate: string) {
    let currentDate = selectedDate;
    let timePeriods = this.buildTimePeriods(currentDate);

    if (this.isSelectedDateExpired(currentDate)) {
      currentDate = this.getTomorrow();
      timePeriods = this.buildTimePeriods(currentDate);
      this.setData({ selectedDate: currentDate });
    }

    const defaultPeriodValue = this.data.useCustomTime ? this.data.selectedTimeSlot : undefined;

    const periodValue = defaultPeriodValue ?? this.data.currentTimePeriod;
    const currentPeriod = timePeriods.find((p) => p.value === periodValue);
    const firstEnabledPeriod = timePeriods.find((p) => !p.disabled);

    const activePeriod = !this.data.useCustomTime
      ? currentPeriod && !currentPeriod.disabled
        ? currentPeriod
        : firstEnabledPeriod
      : currentPeriod && !currentPeriod.disabled
        ? currentPeriod
        : firstEnabledPeriod;

    const selectedPeriodLabel = activePeriod?.label || '';
    const effectiveStart = activePeriod ? this.getAutoStartTimeForRange(activePeriod) : '';
    const selectedPeriodRange = activePeriod ? `${effectiveStart} - ${activePeriod.end}` : '';
    const selectedDurationText = activePeriod
      ? this.formatDurationText(effectiveStart, activePeriod.end) ||
        `${Math.ceil((toTimeMinutes(activePeriod.end) - toTimeMinutes(effectiveStart)) / 60)}h`
      : '';

    this.setData({
      timePeriods,
      currentTimePeriod: activePeriod?.value || '',
      selectedTimeSlot: activePeriod?.value || '',
      currentTimePeriodText: selectedPeriodLabel,
      customTimePeriodText: selectedPeriodRange,
      currentDurationText: selectedDurationText,
      showCustomTime: false,
      useCustomTime: false,
    });
  },

  async loadTimeSlotConfigs(selectedDate: string) {
    try {
      const [slotRes, ruleRes] = await Promise.all([
        getTimeSlotConfigs(),
        getBookingRules().catch(() => null),
      ]);
      const configs = (slotRes.data || []) as Array<any>;
      const bookingRules = (ruleRes?.data || {}) as {
        minCustomBookingDurationMinutes?: number;
        checkinWindowMinutes?: number;
        maxRenewalExtraSlots?: number;
      };
      const minCustomTimeMinutes = Number(
        bookingRules.minCustomBookingDurationMinutes ?? MIN_CUSTOM_TIME_MINUTES
      );
      const checkinWindowMinutes = Number(
        bookingRules.checkinWindowMinutes ?? CHECKIN_WINDOW_MINUTES
      );
      const timeSlotConfigs = configs
        .filter(
          (item) =>
            item &&
            item.enabled !== false &&
            typeof item.label === 'string' &&
            typeof item.value === 'string' &&
            (typeof item.startTime === 'string' || typeof item.start === 'string') &&
            (typeof item.endTime === 'string' || typeof item.end === 'string')
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      this.setData({
        timeSlotConfigs,
        minCustomTimeMinutes,
        checkinWindowMinutes,
      });
    } catch (error) {
      console.warn('加载时间段配置失败，使用默认时间段', error);
      this.setData({
        timeSlotConfigs: [],
      });
    }
    await this.loadSeatOptionConfigs();
    this.initTimeOptions();
    this.initSeatTypeData();
    this.initFilterTexts();
    this.refreshTimePeriods(selectedDate);
    this.applyPendingReservationParamsAfterLoad();
    this.initSeats();
  },

  async loadSeatOptionConfigs() {
    try {
      const [typeRes, facilityRes] = await Promise.all([
        getSeatTypeConfigs(),
        getSeatFacilityConfigs(),
      ]);
      const seatTypeConfigs = ((typeRes.data || []) as Array<any>)
        .filter(
          (item: any) =>
            item &&
            item.enabled !== false &&
            normalizeConfigText(item.value) &&
            normalizeConfigText(item.label)
        )
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      const seatFacilityConfigs = ((facilityRes.data || []) as Array<any>)
        .filter((item: any) => item && item.enabled !== false && normalizeConfigText(item.key))
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

      const seatTypeValueByCode = seatTypeConfigs.reduce(
        (acc: Record<string, string>, item: any) => {
          const typeKey = normalizeConfigText(item.type);
          const value = normalizeConfigText(item.value);
          if (typeKey && value) {
            acc[typeKey] = value;
          }
          return acc;
        },
        {} as Record<string, string>
      );
      const seatTypeLabelByValue = seatTypeConfigs.reduce(
        (acc: Record<string, string>, item: any) => {
          const value = normalizeConfigText(item.value);
          const label = normalizeConfigText(item.label);
          if (value && label) {
            acc[value] = label;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      const facilityOptions = seatFacilityConfigs.map((item: any) => ({
        key: normalizeConfigText(item.key),
        label: normalizeConfigText(item.label) || normalizeConfigText(item.key),
        enabled: item.enabled !== false,
      }));

      const currentFacilities = this.data.facilities as Record<string, boolean>;
      const nextFacilities = facilityOptions.reduce(
        (acc: Record<string, boolean>, item: any) => {
          acc[item.key] = Boolean(currentFacilities[item.key]);
          return acc;
        },
        {
          power: Boolean(currentFacilities.power),
          window: Boolean(currentFacilities.window),
        } as Record<string, boolean> & { power: boolean; window: boolean }
      ) as Record<string, boolean> & { power: boolean; window: boolean };

      this.setData({
        seatTypeConfigs,
        seatTypeValueByCode,
        seatTypeLabelByValue,
        seatFacilityConfigs,
        facilityOptions,
        facilities: nextFacilities,
      });
    } catch (error) {
      console.warn('加载座位配置失败，使用默认选项', error);
      this.setData({
        seatTypeConfigs: [],
        seatTypeValueByCode: {},
        seatTypeLabelByValue: {},
        seatFacilityConfigs: [],
        facilityOptions: [
          { key: 'power', label: 'power', enabled: true },
          { key: 'window', label: 'window', enabled: true },
        ],
      });
    }
  },

  initTimeOptions() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);
    const selectedDate = this.data.selectedDate || '';

    const timePeriods = this.buildTimePeriods(selectedDate);
    const durations = [
      { label: t('reservation.time.duration.1h'), value: '1h' },
      { label: t('reservation.time.duration.2h'), value: '2h' },
      { label: t('reservation.time.duration.4h'), value: '4h' },
      { label: t('reservation.time.duration.allday'), value: 'allday' },
    ];

    const firstEnabledPeriod = timePeriods.find((p) => !p.disabled) || timePeriods[0] || null;
    this.setData({
      timePeriods,
      durations,
      currentTimePeriod: firstEnabledPeriod?.value || '',
      selectedTimeSlot: firstEnabledPeriod?.value || '',
      useCustomTime: false,
      currentTimePeriodText: firstEnabledPeriod?.label || '',
      currentDurationText: durations[1].label,
      customTimePeriodText: firstEnabledPeriod
        ? `${firstEnabledPeriod.start} - ${firstEnabledPeriod.end}`
        : '',
      // 更新多语言文案
      floorSelectText: t('reservation.floor.select'),
      timeSelectText: t('reservation.time.select'),
      timePeriodText: t('reservation.time.period'),
      timeDurationText: t('reservation.time.duration'),
      filterText: t('reservation.filter'),
      searchPlaceholderText: t('reservation.search.placeholder'),
      confirmTitleText: t('reservation.confirm.title'),
      confirmButtonText: t('reservation.confirm.button'),
      customTimeCancelText: t('reservation.time.custom.cancel'),
      customTimeConfirmText: t('reservation.time.custom.confirm'),
      timeRangeLabelText: t('reservation.time.period.selectRange'),
      customTimeStartText: t('reservation.time.custom.start'),
      customTimeEndText: t('reservation.time.custom.end'),
    });
  },

  /**
   * 初始化筛选面板文案
   */
  initFilterTexts() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const rawFilterTitle = t('reservation.filter.title');
    const rawFilterText = t('reservation.filter');
    const rawFilterResult = t('reservation.filter.result');
    const rawNoSeat = t('reservation.hint.noMatchingSeats');

    const isMissing = (value: string, key: string) =>
      !value || value === key || value.includes(key);

    const filterResultText = !isMissing(rawFilterResult, 'reservation.filter.result')
      ? rawFilterResult
      : this.data.currentLang === 'zh'
        ? '筛选结果'
        : 'Filter results';

    const noSeatText = !isMissing(rawNoSeat, 'reservation.hint.noMatchingSeats')
      ? rawNoSeat
      : this.data.currentLang === 'zh'
        ? '暂无匹配座位'
        : 'No matching seats';

    const filterText = !isMissing(rawFilterTitle, 'reservation.filter.title')
      ? rawFilterTitle
      : !isMissing(rawFilterText, 'reservation.filter')
        ? rawFilterText
        : this.data.currentLang === 'zh'
          ? '筛选'
          : 'Filter';

    const facilityPowerConfig = (this.data.seatFacilityConfigs || []).find(
      (item: any) => item.key === 'power'
    );
    const facilityWindowConfig = (this.data.seatFacilityConfigs || []).find(
      (item: any) => item.key === 'window'
    );

    this.setData({
      filterConditionsText: t('reservation.filter.conditions'),
      filterAreaText: t('reservation.filter.area'),
      filterSeatTypeText: t('reservation.filter.seatType'),
      filterFacilityText: t('reservation.filter.facility'),
      filterFacilityPowerText: facilityPowerConfig?.label || 'power',
      filterFacilityWindowText: facilityWindowConfig?.label || 'window',
      filterResetText: t('reservation.filter.reset'),
      filterResultText,
      noSeatText,
      filterText,
      searchPlaceholderText: t('reservation.search.placeholder'),
      confirmTitleText: t('reservation.confirm.title'),
      confirmButtonText: t('reservation.confirm.button'),
      customTimeCancelText: t('reservation.hint.customTimeCancelled'),
      customTimeConfirmText: t('reservation.time.custom.confirm'),
      timeRangeLabelText: t('reservation.time.period.selectRange'),
    });
  },

  /**
   * 更新语言
   */
  updateLanguage() {
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      const currentLang = app.globalData.currentLang || 'zh';

      // 更新语言类名、currentLang 和导航栏标题
      this.setData({
        languageClass: app.globalData.languageClass || 'lang-zh',
        currentLang: currentLang,
        navTitle: app.t('reservation.title'),
      });

      // 重新初始化所有需要多语言的数据
      this.initFloorData();
      this.initAreaData();
      this.initSeatTypeData();
      this.initFilterTexts();
      this.initTimeOptions();

      // 更新预约信息列表
      this.updateReservationInfo();
    }
  },

  /**
   * 初始化楼层数据（从后端加载）
   */
  initFloorData() {
    getFloors()
      .then((res) => {
        const responseData = res?.data as any;
        const floorsData = (Array.isArray(responseData?.list) ? responseData.list : []) as any[];
        if (Array.isArray(floorsData) && floorsData.length > 0) {
          const floors = sortByFloorName(floorsData.map((f: any) => ({ id: f.id, name: f.name })));
          this.setData({ floors, currentFloor: floors[0]?.id ?? this.data.currentFloor });
          // 加载第一个楼层的座位
          this.loadSeats();
        } else {
          this.setData({ floors: [] });
        }
      })
      .catch(() => {
        this.setData({ floors: [] });
      });
  },

  /**
   * 初始化区域数据
   */
  initAreaData() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const allAreaName = String(t('reservation.area.all'));
    const applyAreas = (areaNames: string[]) => {
      const uniqueAreaNames = Array.from(
        new Set(areaNames.map((item) => String(item || '').trim()))
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

      const areas = [
        { id: 'all', name: allAreaName },
        ...uniqueAreaNames.map((name) => ({ id: name, name })),
      ];

      const selectedArea = this.data.selectedArea;
      const currentArea =
        areas.find((a) => a.id === selectedArea.id) ||
        areas.find((a) => a.name === selectedArea.name) ||
        areas[0];

      this.setData({
        areas,
        selectedArea: currentArea,
      });
    };

    getSeatZones({ showLoading: false })
      .then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        applyAreas(list.map((item: any) => item?.name));
      })
      .catch((error) => {
        console.warn('加载区域配置失败，使用默认区域列表', error);
        applyAreas([]);
      });
  },

  /**
   * 初始化座位类型数据
   */
  initSeatTypeData() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const seatTypes = [
      { id: 'all', name: t('reservation.seatType.all') },
      ...(this.data.seatTypeConfigs || []).map((item: any) => ({
        id: String(item.value),
        name: String(item.label || item.value),
      })),
    ];

    const selectedSeatType = this.data.selectedSeatType;
    const currentSeatType =
      seatTypes.find((s) => s.id === selectedSeatType.id) ||
      seatTypes.find((s) => s.name === selectedSeatType.name) ||
      seatTypes[0];

    this.setData({
      seatTypes,
      selectedSeatType: currentSeatType,
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查语言是否变化，避免重复初始化
    const app = getApp();
    const currentLang = app.globalData.currentLang || 'zh';
    const selectedDate = this.getValidReservationDate(this.data.selectedDate || getToday());

    if (currentLang !== this.data.currentLang) {
      this.updateLanguage();
    }

    this.consumePendingReservationParams();
    this.loadSeatMapWrapperRect();
    this.loadWechatTemplateIdsIfNeeded();
    this.initFloorData();
    this.initAreaData();
    this.setData({ selectedDate }, () => {
      this.loadTimeSlotConfigs(selectedDate);
    });
  },

  async loadWechatTemplateIdsIfNeeded() {
    if ((this.data as any).wechatBookingSuccessTemplateId || !isLogin()) {
      return;
    }

    const response = await getWechatTemplateIds().catch(() => null);
    const bookingTemplateId = (response?.data as any)?.BOOKING_SUCCESS;
    if (bookingTemplateId && !bookingTemplateId.startsWith('TEMPLATE_ID_')) {
      this.setData({ wechatBookingSuccessTemplateId: bookingTemplateId });
    }
  },

  consumePendingReservationParams() {
    try {
      const pendingParams = consumePendingReservationParams() as Record<string, any> | null;
      if (pendingParams && Object.keys(pendingParams).length > 0) {
        this.handleFavoriteParams(pendingParams);
      }
    } catch (error) {
      console.error('读取待处理预约参数失败:', error);
    }
  },

  resolveTimeSlotValue() {
    const slotValue = this.data.useCustomTime
      ? this.data.selectedTimeSlot
      : this.data.currentTimePeriod;
    const period = this.data.timePeriods.find((p) => p.value === slotValue);
    if (period?.timeSlot !== undefined) {
      return period.timeSlot;
    }
    return this.data.timePeriods[0]?.timeSlot ?? 0;
  },

  /**
   * 监听页面隐藏时重置预约状态
   */
  onHide() {
    const seatSelectComp: any = this.selectComponent('#seatSelectComponent');
    if (seatSelectComp && typeof seatSelectComp.hideSeatTooltip === 'function') {
      seatSelectComp.hideSeatTooltip();
    }
    this.resetReservationState();
  },

  /**
   * 监听页面卸载时重置预约状态
   */
  onUnload() {
    const seatSelectComp: any = this.selectComponent('#seatSelectComponent');
    if (seatSelectComp && typeof seatSelectComp.hideSeatTooltip === 'function') {
      seatSelectComp.hideSeatTooltip();
    }
    this.resetReservationState();
  },

  /**
   * 重置预约页面状态到默认值
   */
  resetReservationState() {
    this.setData({
      searchValue: '',
      showFilterPanel: false,
      selectedArea: { id: 'all', name: '' },
      selectedSeatType: { id: 'all', name: '' },
      facilities: {
        power: false,
        window: false,
      },
      seats: [],
      selectedSeatIds: [],
      selectedSeatText: '',
      selectedSeatInfo: null,
      currentTimePeriod: 'morning',
      selectedTimeSlot: 'morning',
      currentDuration: '2h',
      showCustomTime: false,
      useCustomTime: false,
      showDatetimePicker: false,
      datetimePickerField: '',
      datetimePickerType: 'date',
      datetimePickerValue: 0,
      startTime: '08:00',
      endTime: '12:00',
      customStartTime: '',
      customEndTime: '',
      customTimePeriodText: '',
      currentTimePeriodText: '',
      currentDurationText: '',
      reservationInfoItems: [],
      seatCount: 0,
      seatsLoading: false,
      seatInfoPopoverStyle: '',
      popoverDirection: 'down',
    });
  },

  /**
   * 楼层选择事件
   */
  onFloorTap(e: any) {
    const floorId = e.currentTarget.dataset.id;
    this.setData({
      currentFloor: floorId,
      selectedSeatIds: [],
      selectedSeatText: '',
    });
    this.loadSeats();
  },

  /**
   * 筛选按钮点击事件
   */
  onFilterTap() {
    this.setData({
      showFilterPanel: !this.data.showFilterPanel,
    });
  },

  /**
   * 搜索内容变化事件
   */
  onSearchChange(e: any) {
    const value =
      typeof e.detail === 'string'
        ? e.detail
        : typeof e.detail?.value === 'string'
          ? e.detail.value
          : '';

    this.setData({
      searchValue: value,
    });
    this.resetSeatSelection();
    this.debounceLoadSeats();
  },

  /**
   * 搜索确认事件
   */
  onSearchConfirm(e: any) {
    const keyword =
      typeof e.detail === 'string'
        ? e.detail
        : typeof e.detail?.value === 'string'
          ? e.detail.value
          : '';

    this.setData({
      searchValue: keyword,
    });
    this.resetSeatSelection();
    this.loadSeats();
  },

  debounceLoadSeats() {
    clearTimeout((this as any).seatSearchTimer);
    (this as any).seatSearchTimer = setTimeout(() => {
      this.loadSeats();
    }, 250);
  },

  /**
   * 区域选择事件
   */
  onAreaTap() {
    wx.showActionSheet({
      itemList: this.data.areas.map((item) => item.name),
      success: (res) => {
        const index = res.tapIndex;
        this.setData({
          selectedArea: this.data.areas[index],
        });
        this.resetSeatSelection();
        this.loadSeats();
      },
    });
  },

  /**
   * 座位类型选择事件
   */
  onSeatTypeTap() {
    wx.showActionSheet({
      itemList: this.data.seatTypes.map((item) => item.name),
      success: (res) => {
        const index = res.tapIndex;
        this.setData({
          selectedSeatType: this.data.seatTypes[index],
        });
        this.resetSeatSelection();
        this.loadSeats();
      },
    });
  },

  /**
   * 设施选项切换事件
   */
  onFacilityTap(e: any) {
    const type = String(e.currentTarget?.dataset?.type || e.target?.dataset?.type || '').trim();
    if (!type) return;
    const facilities = {
      ...(this.data.facilities as Record<string, boolean> & { power: boolean; window: boolean }),
    } as Record<string, boolean> & { power: boolean; window: boolean };
    const nextValue = typeof e.detail?.value === 'boolean' ? e.detail.value : !facilities[type];
    facilities[type] = nextValue;
    this.setData({
      facilities,
    });
    this.resetSeatSelection();
    this.loadSeats();
  },

  /**
   * 重置筛选条件
   */
  onResetFilter() {
    const defaultFacilities = {
      power: false,
      window: false,
    } as { power: boolean; window: boolean } & Record<string, boolean>;
    (this.data.facilityOptions || []).forEach((item: any) => {
      defaultFacilities[item.key] = false;
    });

    this.setData({
      selectedArea: { id: 'all', name: this.data.areas[0]?.name || '' },
      selectedSeatType: { id: 'all', name: this.data.seatTypes[0]?.name || '' },
      facilities: defaultFacilities,
    });
    this.resetSeatSelection();
    this.loadSeats();
  },

  /**
   * 初始化座位数据（兼容，调用 loadSeats）
   */
  initSeats() {
    this.loadSeats();
  },

  /**
   * 从后端加载座位数据
   */
  loadSeats() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);
    const { currentFloor, selectedDate, selectedArea, selectedSeatType, facilities, searchValue } =
      this.data;

    // 构造时段值
    const timeSlot = this.resolveTimeSlotValue();

    const params: any = {};
    if (selectedDate) params.date = selectedDate;
    if (timeSlot !== undefined) params.timeSlot = timeSlot;

    this.setData({ seatsLoading: true });
    getFloorSeats(String(currentFloor), params)
      .then((res) => {
        const responseData = res.data as any;
        if (responseData?.seats) {
          const statusMap: Record<string, string> = {
            '0': 'available',
            '1': 'booked',
            '2': 'maintenance',
            available: 'available',
            booked: 'booked',
            maintenance: 'maintenance',
          };
          const floorName = String(responseData.floorName || '').trim();
          const seatTypeValueByCode = this.data.seatTypeValueByCode || {};
          const seatTypeLabelByValue = this.data.seatTypeLabelByValue || {};
          const facilityOptions =
            (this.data.facilityOptions || []).length > 0
              ? (this.data.facilityOptions || []).map((item: any) => ({
                  key: String(item.key || '').trim(),
                  label: String(item.label || item.key || '').trim(),
                }))
              : [
                  {
                    key: 'power',
                    label: this.data.filterFacilityPowerText || 'power',
                  },
                  {
                    key: 'window',
                    label: this.data.filterFacilityWindowText || 'window',
                  },
                ];

          const allSeats = responseData.seats.map((s: any) => {
            const row = Number(s.row);
            const col = Number(s.col);
            const seatLabel = `R${row}C${col}`;
            const rawTypeValue = normalizeConfigText((s as any).typeValue);
            const typeValue =
              rawTypeValue ||
              resolveSeatTypeValue(s.type, seatTypeValueByCode) ||
              normalizeConfigText(s.type);
            const typeText = resolveSeatTypeLabel(
              s.type,
              typeValue,
              seatTypeLabelByValue,
              (s as any).typeLabel
            );

            const facilityFlags = facilityOptions.reduce(
              (acc: Record<string, boolean>, option: { key: string; label: string }) => {
                if (!option.key) return acc;
                acc[option.key] = resolveSeatFacilityFlag(s, option.key);
                return acc;
              },
              {} as Record<string, boolean>
            );

            const featureLabels = facilityOptions
              .filter((option: { key: string; label: string }) => facilityFlags[option.key])
              .map((option: { key: string; label: string }) => option.label)
              .filter(Boolean);

            const booking = (s as any).booking;
            return {
              id: String(s.id),
              row: Number.isFinite(row) ? row : 0,
              col: Number.isFinite(col) ? col : 0,
              label: seatLabel,
              status: statusMap[String(s.status)] || 'available',
              isMine: !!s.isMine,
              type: typeValue,
              typeValue,
              typeLabel: typeText,
              floor: floorName,
              hasSocket: !!s.hasSocket,
              isWindow: !!s.isWindow,
              facilityFlags,
              zone: s.zone || '',
              description: s.description || '',
              tags: [typeText, ...featureLabels],
              bookedTimeRange: '',
              bookings: booking
                ? [
                    {
                      startTime: booking.startTime,
                      endTime: booking.endTime,
                      status: 'booked',
                      timeSlot: booking.timeSlot,
                    },
                  ]
                : [],
              timeSlotStatus: (s as any).timeSlotStatus || undefined,
            };
          });

          const zoneNames = (allSeats as any[])
            .map((item: any) => String(item?.zone || '').trim())
            .filter((name: string) => Boolean(name));
          const configuredAreaNames = (this.data.areas || [])
            .map((item) => String(item?.id || '').trim())
            .filter((name) => Boolean(name) && name !== 'all');
          const areaNames: string[] = Array.from(
            new Set<string>([...configuredAreaNames, ...zoneNames])
          );
          areaNames.sort((a: string, b: string) => a.localeCompare(b, 'zh-Hans-CN'));

          const allAreaName = String(t('reservation.area.all'));
          const areas: Array<{ id: string; name: string }> = [
            { id: 'all', name: allAreaName },
            ...areaNames.map((name: string) => ({ id: name, name })),
          ];
          const currentArea: { id: string; name: string } =
            areas.find((item) => item.id === selectedArea?.id) ||
            areas.find((item) => item.name === selectedArea?.name) ||
            areas[0];

          const currentSeatType =
            (this.data.seatTypes || []).find((item) => item.id === selectedSeatType?.id) ||
            (this.data.seatTypes || []).find((item) => item.name === selectedSeatType?.name) ||
            selectedSeatType;

          let seats = [...allSeats];

          if (currentArea && currentArea.id !== 'all') {
            seats = seats.filter(
              (seat: any) =>
                String(seat.zone || '').trim() === String(currentArea.id || currentArea.name).trim()
            );
          }

          const selectedTypeId = String(currentSeatType?.id || '').trim();
          const selectedTypeName = String(currentSeatType?.name || '').trim();
          if (selectedTypeId && selectedTypeId !== 'all') {
            seats = seats.filter(
              (seat: any) =>
                String(seat.typeValue || '') === selectedTypeId ||
                (selectedTypeName && String(seat.typeLabel || '') === selectedTypeName)
            );
          }

          const activeFacilityKeys = Object.keys(facilities || {}).filter((key) =>
            Boolean((facilities as Record<string, boolean>)[key])
          );
          if (activeFacilityKeys.length > 0) {
            seats = seats.filter((seat: any) =>
              activeFacilityKeys.every((key) => Boolean(seat.facilityFlags?.[key]))
            );
          }

          const keyword = String(searchValue || '')
            .trim()
            .toLowerCase();
          if (keyword) {
            seats = seats.filter((seat: any) => {
              const searchable = [
                seat.label,
                seat.zone,
                seat.typeLabel,
                seat.description,
                `R${seat.row}`,
                `C${seat.col}`,
                `${seat.row}-${seat.col}`,
              ]
                .filter(Boolean)
                .map((item) => String(item).toLowerCase());
              return searchable.some((item) => item.includes(keyword));
            });
          }
          seats = sortBySeatPosition(seats);
          const selectedSeatId = this.data.selectedSeatIds[0];
          const matchedSeat = selectedSeatId
            ? seats.find((seat: any) => seat.id === selectedSeatId)
            : null;
          this.setData({
            areas,
            selectedArea: currentArea,
            selectedSeatType: currentSeatType,
            seats,
            seatCount: seats.length,
            selectedSeatIds: matchedSeat ? [matchedSeat.id] : [],
            selectedSeatText: matchedSeat
              ? this.data.selectedSeatText || matchedSeat.label || matchedSeat.id
              : '',
          });

          if (seats.length === 0) {
            const keyword = String(searchValue || '').trim();
            const hasFacilityFilter = Object.keys(facilities || {}).some((key) =>
              Boolean((facilities as Record<string, boolean>)[key])
            );
            if (
              keyword ||
              selectedArea?.id !== 'all' ||
              selectedSeatType?.id !== 'all' ||
              hasFacilityFilter
            ) {
              wx.showToast({
                title: this.data.noSeatText || '暂无匹配座位',
                icon: 'none',
                duration: 1800,
              });
            }
          }

          this.updateReservationInfo();
        }
      })
      .catch((err) => {
        console.error('加载座位失败:', err);
        wx.showToast({ title: '加载座位失败', icon: 'none' });
      })
      .finally(() => {
        this.setData({ seatsLoading: false });
      });
  },

  /**
   * 处理座位选择事件
   */
  onSeatSelect(e: any) {
    const { seatId, seat } = e.detail;

    // 如果点击的是已预约的座位，只显示悬浮信息，不允许选择
    if (seat.status === 'booked' || seat.isMine) {
      // 已预约座位不执行任何操作
    }

    // 每次只能选择一个座位
    const selectedSeatIds = [seatId];
    const selectedSeatText = seat.label || seatId;

    this.setData({
      selectedSeatIds,
      selectedSeatText,
      selectedSeatInfo: this.buildSeatInfo(seat),
    });

    // 更新预约信息列表
    this.updateReservationInfo();

    console.log('座位选择:', seatId, seat, '已选座位:', selectedSeatIds);
  },

  onSeatTap(e: any) {
    const { seat, rect } = e.detail;
    if (!this.data.seatMapWrapperRect) {
      this.loadSeatMapWrapperRect();
    }

    const fallbackWrapperRect = wx.getSystemInfoSync();
    const wrapperRect =
      this.data.seatMapWrapperRect ||
      ({
        left: 0,
        top: 0,
        width: fallbackWrapperRect.windowWidth,
        height: fallbackWrapperRect.windowHeight,
      } as any);

    const positioning = this.computeSeatPopoverPosition(rect, wrapperRect);
    this.setData({
      selectedSeatInfo: this.buildSeatInfo(seat),
      seatInfoPopoverStyle: positioning.style,
      popoverDirection: positioning.direction as 'down' | 'up',
    });
  },

  onCloseSeatInfo() {
    this.setData({
      selectedSeatInfo: null,
    });
  },

  onPageTap() {
    const seatSelectComp: any = this.selectComponent('#seatSelectComponent');
    if (seatSelectComp && typeof seatSelectComp.hideSeatTooltip === 'function') {
      seatSelectComp.hideSeatTooltip();
    }
  },

  noop() {
    // 用于阻止点击冒泡到页面根容器，避免关闭 tooltip
  },

  buildSeatInfo(seat: any) {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);
    const statusMap: Record<string, string> = {
      available: t('common.status.available'),
      booked: t('common.status.booked'),
      maintenance: t('common.status.maintenance'),
      selected: t('common.status.selected'),
      mine: t('common.status.booked'),
    };
    const powerLabel =
      (this.data.seatFacilityConfigs || []).find((item: any) => item.key === 'power')?.label ||
      'power';
    const windowLabel =
      (this.data.seatFacilityConfigs || []).find((item: any) => item.key === 'window')?.label ||
      'window';

    return {
      ...seat,
      statusText: statusMap[seat.status] || seat.status,
      hasSocketText: seat.hasSocket ? powerLabel : '',
      isWindowText: seat.isWindow ? windowLabel : '',
      tags:
        seat.tags ||
        [
          seat.typeLabel || '',
          seat.hasSocket ? powerLabel : '',
          seat.isWindow ? windowLabel : '',
        ].filter(Boolean),
      bookedTimeRange: seat.bookedTimeRange || seat.timeRange || '',
    };
  },

  computeSeatPopoverPosition(rect: any, wrapperRect: any) {
    const cardWidth = 200;
    const cardHeight = 140;
    const offsetLeft = wrapperRect?.left || 0;
    const offsetTop = wrapperRect?.top || 0;
    const centerX = rect?.left ? rect.left + rect.width / 2 : cardWidth / 2;
    const rawLeft = centerX - offsetLeft;
    const left = Math.min(
      Math.max(rawLeft, cardWidth / 2 + 10),
      (wrapperRect?.width || 0) - cardWidth / 2 - 10
    );

    const belowTop = rect?.top ? rect.top + rect.height + 6 : 90;
    const aboveTop = rect?.top ? rect.top - cardHeight - 6 : 12;
    const wrapperHeight = wrapperRect?.height || 0;
    const useAbove = rect && belowTop + cardHeight > offsetTop + wrapperHeight;
    const rawTop = useAbove ? aboveTop : belowTop;
    const top = Math.max(10, rawTop - offsetTop);

    return {
      style: `left: ${left}px; top: ${top}px; width: ${cardWidth}px; transform: translateX(-50%);`,
      direction: useAbove ? 'up' : 'down',
    };
  },

  /**
   * 日期选择点击
   */
  onDateClick() {
    this.setData({
      showDatetimePicker: true,
      datetimePickerField: 'date',
      datetimePickerType: 'date',
      datetimePickerValue: toTimestamp(this.data.selectedDate),
      datePickerMinTimestamp: toTimestamp(getToday()),
    });
  },

  onStartTimeClick() {
    this.setData({
      showDatetimePicker: true,
      datetimePickerField: 'start',
      datetimePickerType: 'time',
      datetimePickerValue: this.data.startTime,
    });
  },

  onEndTimeClick() {
    this.setData({
      showDatetimePicker: true,
      datetimePickerField: 'end',
      datetimePickerType: 'time',
      datetimePickerValue: this.data.endTime,
    });
  },

  onDatetimePickerConfirm(e: any) {
    const value = e.detail;
    if (this.data.datetimePickerField === 'date') {
      let selectedDate = formatDateTime(value, 'YYYY-MM-DD');
      const today = getToday();
      if (selectedDate < today) {
        wx.showToast({
          title: '不能选择今天之前的日期',
          icon: 'none',
        });
        this.setData({ showDatetimePicker: false });
        return;
      }
      if (selectedDate === today && this.isSelectedDateExpired(today)) {
        selectedDate = this.getTomorrow();
        wx.showToast({
          title: '今天时段已过期，已自动切换到明天',
          icon: 'none',
        });
      }
      if (selectedDate === today && this.isSelectedDateExpired(today)) {
        selectedDate = this.getTomorrow();
        wx.showToast({
          title: '今天时段已过期，已自动切换到明天',
          icon: 'none',
        });
      }
      this.setData({ selectedDate });
      this.resetSeatSelection();
      this.refreshTimePeriods(selectedDate);
      this.updateReservationInfo();
      this.loadSeats();
    } else if (this.data.datetimePickerField === 'start') {
      this.setData({ startTime: value });
    } else if (this.data.datetimePickerField === 'end') {
      this.setData({ endTime: value });
    }
    this.setData({ showDatetimePicker: false });
  },

  onDatetimePickerCancel() {
    this.setData({ showDatetimePicker: false });
  },

  /**
   * 时段选择
   */
  onTimePeriodTap(e: any) {
    const { value } = e.currentTarget.dataset;
    const period = this.data.timePeriods.find((p) => p.value === value);
    if (!period || period.disabled) {
      return;
    }

    const periodText = period.label;
    const startTime = this.getAutoStartTimeForRange(period);
    const timeRangeText = `${startTime} - ${period.end}`;

    this.setData({
      currentTimePeriod: value,
      selectedTimeSlot: value,
      useCustomTime: false,
      currentTimePeriodText: periodText,
      customTimePeriodText: timeRangeText,
      currentDurationText:
        this.formatDurationText(startTime, period.end) ||
        `${Math.ceil((toTimeMinutes(period.end) - toTimeMinutes(startTime)) / 60)}h`,
      showCustomTime: false,
      startTime,
      endTime: period.end,
    });

    this.resetSeatSelection();
    this.updateReservationInfo();
    this.loadSeats();

    console.log('选择时段:', value);
  },

  /**
   * 时长选择
   */
  onDurationTap(e: any) {
    const { value } = e.currentTarget.dataset;

    // 从 durations 中查找对应的文本
    const duration = this.data.durations.find((d) => d.value === value);
    const durationText = duration ? duration.label : '';

    this.setData({
      currentDuration: value,
      currentDurationText: durationText,
    });

    // 更新预约信息列表
    this.updateReservationInfo();

    console.log('选择时长:', value);
  },

  /**
   * 切换自定义时间段
   */
  toggleCustomTime() {
    const range = this.getSelectedSlotRange();
    let startTime = range.start;
    if (this.isSelectedDateToday()) {
      const nowTime = this.getTodayTimeString();
      if (nowTime > range.start && nowTime < range.end) {
        startTime = nowTime;
      }
    }
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);
    const currentHint =
      t('reservation.hint.customTimeHelp') ||
      `自定义时间段不得少于${this.data.minCustomTimeMinutes}分钟，且必须在当前时段 ${range.start} - ${range.end} 内`;

    this.setData({
      showCustomTime: !this.data.showCustomTime,
      startTime,
      endTime: range.end,
      customTimeHintText: currentHint,
    });
  },

  /**
   * 开始时间变化
   */
  onStartTimeChange(e: any) {
    const startTime =
      typeof e.detail === 'string' ? e.detail : e.detail?.value || this.data.startTime;
    this.setData({ startTime });
  },

  /**
   * 结束时间变化
   */
  onEndTimeChange(e: any) {
    const endTime = typeof e.detail === 'string' ? e.detail : e.detail?.value || this.data.endTime;
    this.setData({ endTime });
  },

  /**
   * 确认自定义时间段
   */
  onConfirmCustomTime() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);
    const { startTime, endTime } = this.data;
    const range = this.getSelectedSlotRange();

    // 验证自定义时间填写规则：开始或结束时间只填写一个时不能确认
    if (!startTime || !endTime) {
      wx.showToast({
        title: t('reservation.hint.customTimeBothRequired') || '开始时间和结束时间必须同时填写',
        icon: 'none',
      });
      return;
    }

    // 验证结束时间必须晚于开始时间
    if (startTime >= endTime) {
      wx.showToast({
        title: t('reservation.hint.endTimeMustAfterStart') || '结束时间必须晚于开始时间',
        icon: 'none',
      });
      return;
    }

    const durationMinutes = toTimeMinutes(endTime) - toTimeMinutes(startTime);
    if (durationMinutes < this.data.minCustomTimeMinutes) {
      wx.showToast({
        title:
          t('reservation.hint.customTimeTooShort') ||
          `自定义时长不能少于 ${this.data.minCustomTimeMinutes} 分钟`,
        icon: 'none',
      });
      return;
    }

    if (startTime < range.start || endTime > range.end) {
      wx.showToast({
        title: t('reservation.hint.customTimeSlotRange') || '自定义时间必须在所选时间段范围内',
        icon: 'none',
      });
      return;
    }

    const currentDurationText =
      this.formatDurationText(startTime, endTime) ||
      `${Math.ceil((toTimeMinutes(endTime) - toTimeMinutes(startTime)) / 60)}h`;

    this.setData({
      customStartTime: startTime,
      customEndTime: endTime,
      customTimePeriodText: `${startTime} - ${endTime}`,
      showCustomTime: false,
      useCustomTime: true,
      currentTimePeriodText: `${startTime} - ${endTime}`,
      currentDurationText,
    });

    // 更新预约信息列表
    this.updateReservationInfo();

    // 不再显示确认提示，避免无意义 toast
  },

  /**
   * 更新预约信息列表
   */
  updateReservationInfo() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    // 使用实际的预约时间范围
    const effectiveRange = this.getEffectiveBookingTimeRange();
    const periodValue = `${effectiveRange.startTime} - ${effectiveRange.endTime}`;
    const durationText =
      this.formatDurationText(effectiveRange.startTime, effectiveRange.endTime) ||
      this.data.currentDurationText;

    const items = [
      { label: t('reservation.confirm.seat'), value: this.data.selectedSeatText || '-' },
      { label: t('reservation.confirm.date'), value: this.data.selectedDate || '-' },
      { label: t('reservation.confirm.period'), value: periodValue },
      { label: t('reservation.confirm.duration'), value: durationText },
    ];

    this.setData({
      reservationInfoItems: items,
    });
  },

  resetSeatSelection() {
    const seatSelectComp: any = this.selectComponent('#seatSelectComponent');
    if (seatSelectComp && typeof seatSelectComp.hideSeatTooltip === 'function') {
      seatSelectComp.hideSeatTooltip();
    }
    this.setData({
      selectedSeatIds: [],
      selectedSeatText: '',
      selectedSeatInfo: null,
    });
    this.updateReservationInfo();
  },

  /**
   * 确认预约
   */
  async onConfirmReservation() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const { selectedSeatIds, selectedDate, currentDurationText } = this.data;

    if (selectedSeatIds.length === 0) {
      wx.showToast({
        title: t('reservation.hint.pleaseSelectSeat') || '请选择座位',
        icon: 'none',
      });
      return;
    }

    if (!selectedDate) {
      wx.showToast({
        title: t('reservation.hint.pleaseSelectDate'),
        icon: 'none',
      });
      return;
    }

    // 更新预约信息（确保是最新的）
    this.updateReservationInfo();

    const periodValue = this.data.customTimePeriodText || this.data.currentTimePeriodText;

    // 显示确认对话框
    wx.showModal({
      title: t('reservation.confirm.title'),
      content: `${t('reservation.confirm.seat')}: ${this.data.selectedSeatText}\n${t('reservation.confirm.date')}: ${selectedDate}\n${t('reservation.confirm.period')}: ${periodValue}\n${t('reservation.confirm.duration')}: ${currentDurationText}`,
      confirmText: t('reservation.confirm.button'),
      cancelText: t('common.btn.cancel'),
      success: async (res) => {
        if (res.confirm) {
          const selectedTimePeriod = this.data.timePeriods.find(
            (p: any) => p.value === this.data.selectedTimeSlot
          );
          if (selectedTimePeriod?.disabled) {
            wx.showToast({
              title: t('reservation.hint.invalidTimeSlot') || 'Invalid time slot',
              icon: 'none',
            });
            return;
          }

          // 构建预约参数
          const seatId = selectedSeatIds[0];
          const timePeriod = this.resolveTimeSlotValue();

          // 获取开始和结束时间
          const effectiveRange = this.getEffectiveBookingTimeRange();
          let startTime = effectiveRange.startTime;
          let endTime = effectiveRange.endTime;

          if (this.data.useCustomTime) {
            if (!startTime || !endTime || startTime >= endTime) {
              wx.showToast({
                title: t('reservation.hint.endTimeMustAfterStart') || '结束时间必须晚于开始时间',
                icon: 'none',
              });
              return;
            }
            const durationMinutes = toTimeMinutes(endTime) - toTimeMinutes(startTime);
            if (durationMinutes < this.data.minCustomTimeMinutes) {
              wx.showToast({
                title:
                  t('reservation.hint.customTimeTooShort') ||
                  `自定义时间段不得少于${this.data.minCustomTimeMinutes}分钟`,
                icon: 'none',
              });
              return;
            }
            const range = this.getSelectedSlotRange();
            if (startTime < range.start || endTime > range.end) {
              wx.showToast({
                title:
                  t('reservation.hint.customTimeSlotRange') || '自定义时间必须在所选时间段范围内',
                icon: 'none',
              });
              return;
            }
            if (startTime === range.start && endTime === range.end) {
              wx.showToast({
                title: t('reservation.hint.customTimeSameAsSlot') || '自定义时间不能等于完整时间段',
                icon: 'none',
              });
              return;
            }
            if (this.data.selectedDate === getToday()) {
              const nowMinutes = getCurrentTimeMinutes();
              const [startHour, startMin] = startTime.split(':').map(Number);
              const startMinutes = startHour * 60 + startMin;
              if (startMinutes < nowMinutes) {
                wx.showToast({
                  title: t('reservation.hint.invalidCustomTime') || 'Invalid custom time',
                  icon: 'none',
                });
                return;
              }
            }
          }

          if (!isLogin()) {
            wx.showToast({ title: t('common.hint.pleaseLogin') || '请先登录', icon: 'none' });
            return;
          }

          if (!ensureBoundStudentInfo()) {
            return;
          }

          const bookingTemplateId = (this.data as any).wechatBookingSuccessTemplateId;
          if (bookingTemplateId) {
            const result = await requestBookingSubscribeMessage(bookingTemplateId);
            const status = result ? result[bookingTemplateId] : undefined;
            if (status !== 'accept') {
              wx.showToast({
                title:
                  t('reservation.hint.subscribeMessageDeclined') ||
                  '您已拒绝订阅消息，预约通知可能无法及时收到',
                icon: 'none',
                duration: 2000,
              });
            }
          }

          createBooking({
            seatId: parseInt(seatId),
            date: selectedDate,
            timeSlot: timePeriod,
            startTime,
            endTime,
          })
            .then(() => {
              wx.showToast({
                title: t('reservation.hint.reservationSuccess') || t('common.hint.success'),
                icon: 'success',
                duration: 1500,
              });

              // 预约成功后清空本次选择状态，避免残留上次已选座位
              this.setData({
                selectedSeatIds: [],
                selectedSeatText: '',
                selectedSeatInfo: null,
              });
              this.updateReservationInfo();

              // 重新加载座位并跳转
              this.loadSeats();
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/my-reservation/my-reservation',
                });
              }, 1500);
            })
            .catch((err) => {
              console.error('预约失败:', err);
              const message =
                err?.message ||
                err?.data?.message ||
                err?.response?.data?.message ||
                t('reservation.hint.reservationFailed') ||
                '预约失败，请稍后重试';
              wx.showToast({
                title: message,
                icon: 'none',
                duration: 2500,
              });
            });
        }
      },
    });
  },

  /**
   * 处理座位选择错误
   */
  onSeatError(e: any) {
    const { seatId, message } = e.detail;
    console.warn('座位选择错误:', seatId, message);
    // Tooltip already provides seat status information, avoid duplicate toast.
  },
});
