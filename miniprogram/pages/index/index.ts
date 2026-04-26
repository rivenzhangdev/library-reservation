// @ts-ignore
import {
  checkinActivity,
  checkoutActivity,
  getActivities,
  getActivityDetail,
  joinActivity,
} from '../../apis/activity';
import { checkin, checkout, getBookingDetail } from '../../apis/booking';
import { getSeatFacilityConfigs, getSeatTypeConfigs, getTimeSlotConfigs } from '../../apis/config';
import { getFloors, getFloorSeats, getSeatOverview } from '../../apis/seats';
import { favoriteSeat, getFavorites } from '../../apis/user';
import * as echarts from '../../components/ec-canvas/echarts.min';
import { resolveAssetUrl } from '../../utils/assets';
import { getToken, getUserInfo, redirectToLogin } from '../../utils/auth';
import { t } from '../../utils/i18n';
import { openReservationWithParams } from '../../utils/reservationNavigator';
import { compareFloorName, compareSeatPosition } from '../../utils/sort';
import { formatMonthDayTime, getCurrentTimeSlot, getToday } from '../../utils/time';
import { getCurrentTimeSlotLabel, getEnabledChronologicalTimeSlots } from '../../utils/time-slot';

interface SearchTagItem {
  key: string;
  label: string;
  icon: string;
  keyword: string;
  filterType: 'seatType' | 'facility';
  filterValue: string;
}

const ScanPayloadType = {
  BOOKING: 0,
  ACTIVITY: 1,
} as const;

type ScanPayloadTypeValue = (typeof ScanPayloadType)[keyof typeof ScanPayloadType];

function parseScanPayloadType(type: any): ScanPayloadTypeValue {
  const normalized = String(type).toLowerCase();
  if (normalized === 'activity' || normalized === '1') return ScanPayloadType.ACTIVITY;
  return ScanPayloadType.BOOKING;
}

function normalizeSearchTagKey(rawValue: any) {
  return String(rawValue || '')
    .trim()
    .toLowerCase();
}

function resolveSearchTagIcon(icon: any, rawValue: any) {
  const configuredIcon = String(icon || '').trim();
  if (configuredIcon) return configuredIcon;

  const key = normalizeSearchTagKey(rawValue);
  if (['power', 'socket', 'hassocket', 'has_socket'].includes(key)) return 'underway-o';
  if (['window', 'iswindow', 'is_window'].includes(key)) return 'photo-o';
  if (['single', 'single-seat'].includes(key)) return 'location-o';
  if (['double', 'double-seat'].includes(key)) return 'friends-o';
  if (['group', 'group-seat'].includes(key)) return 'cluster-o';
  if (['open', 'open-seat'].includes(key)) return 'passed';
  return 'search';
}

function buildSearchTagItem(
  filterType: 'seatType' | 'facility',
  rawValue: any,
  label: string,
  icon?: string
): SearchTagItem {
  const normalizedValue = String(rawValue || '').trim();
  const normalizedLabel = String(label || normalizedValue || '').trim() || normalizedValue;
  const normalizedKey = `${filterType}:${normalizeSearchTagKey(normalizedValue)}`;
  return {
    key: normalizedKey,
    label: normalizedLabel,
    icon: resolveSearchTagIcon(icon, normalizedValue),
    keyword: normalizedLabel,
    filterType,
    filterValue: normalizedValue,
  };
}

function buildDefaultSearchTags(): SearchTagItem[] {
  return [
    buildSearchTagItem('facility', 'power', t('search.tags.power'), 'underway-o'),
    buildSearchTagItem('facility', 'window', t('search.tags.window'), 'photo-o'),
    buildSearchTagItem('seatType', 'single', t('search.tags.single'), 'location-o'),
    buildSearchTagItem('seatType', 'double', t('search.tags.double'), 'friends-o'),
    buildSearchTagItem('seatType', 'group', t('search.tags.group'), 'cluster-o'),
  ];
}

function formatDate(value?: string) {
  return formatMonthDayTime(value);
}

function toMinutes(text: string) {
  const parts = String(text || '').split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return -1;
  return hours * 60 + minutes;
}

function resolveOpeningInfo(timeSlotConfigs: any[]) {
  const enabled = getEnabledChronologicalTimeSlots(timeSlotConfigs).filter(
    (item: any) => item.startTime && item.endTime
  );

  if (!enabled.length) {
    return {
      openingHoursTime: t('openingHours.closedTime'),
      openingHoursStatus: t('openingHours.statusClosed'),
      openingHoursTagType: 'danger' as 'success' | 'danger',
      isReservableNow: false,
    };
  }

  const first = enabled[0];
  const last = enabled[enabled.length - 1];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpenNow = enabled.some((item: any) => {
    const start = toMinutes(String(item.startTime));
    const end = toMinutes(String(item.endTime));
    return start >= 0 && end >= 0 && currentMinutes >= start && currentMinutes < end;
  });

  return {
    openingHoursTime: `${first.startTime} - ${last.endTime}`,
    openingHoursStatus: isOpenNow ? t('openingHours.statusOpen') : t('openingHours.statusClosed'),
    openingHoursTagType: (isOpenNow ? 'success' : 'danger') as 'success' | 'danger',
    isReservableNow: isOpenNow,
  };
}

Page({
  data: {
    value: '',
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    ec: {
      lazyLoad: true,
    } as any,
    navTitle: '',
    searchPlaceholder: '',
    openingHoursTitle: '',
    openingHoursTime: '',
    openingHoursStatus: '',
    openingHoursTagType: 'danger' as 'success' | 'danger',
    isReservableNow: false,
    seatStatusTitle: '',
    realTimeTitle: '',
    recommendTitle: '',
    reserveButtonText: '',
    viewAllText: '',
    activityTitle: '',
    viewMoreActivity: '',
    seatEmptyHint: '',
    activityEmptyHint: '',
    searchTags: [] as SearchTagItem[],
    actionCards: [] as Array<{
      id: string;
      icon: string;
      iconType: 'vant' | 'iconfont';
      text: string;
      iconBg: string;
      iconColor: string;
      cardBg: string;
    }>,
    banners: [] as Array<{ image: string; title: string; activityId: string }>,
    displayBanners: [] as Array<{ image: string; title: string; activityId: string }>,
    seatStatus: {
      total: { label: '', value: '0' },
      available: { label: '', value: '0', percent: '0%' },
      reserved: { label: '', value: '0', percent: '0%' },
      maintenance: { label: '', value: '0', percent: '0%' },
    },
    realTimeItems: [] as Array<{
      icon: string;
      label: string;
      value: string;
      sublabel: string;
      bgColor: string;
      iconColor: string;
    }>,
    seatList: [] as any[],
    activityList: [] as any[],
  },

  onLoad() {
    this.updateLanguage();
    this.loadSearchTags();
    this.loadSeatOverview();
    this.loadActivities();
  },

  onShow() {
    this.updateLanguage();
    this.loadSearchTags();
    this.loadSeatOverview();
    this.loadActivities();
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    const currentLang = app.globalData.currentLang || 'zh';

    this.setData({
      currentLang,
      languageClass: app.globalData.languageClass || 'lang-zh',
      navTitle: t('nav.title'),
      searchPlaceholder: t('search.placeholder'),
      openingHoursTitle: t('openingHours.title'),
      openingHoursTime: t('openingHours.time'),
      openingHoursStatus: t('openingHours.statusClosed'),
      openingHoursTagType: 'danger',
      seatStatusTitle: t('seatStatus.title'),
      realTimeTitle: t('realTime.title'),
      recommendTitle: t('recommend.title'),
      reserveButtonText: t('common.btn.reserve'),
      viewAllText: t('common.btn.viewAll'),
      activityTitle: t('common.quick.activityList'),
      viewMoreActivity: t('common.btn.viewMore'),
      seatEmptyHint: t('common.hint.noData'),
      activityEmptyHint: t('common.empty.activity'),
      searchTags: buildDefaultSearchTags(),
      actionCards: [
        {
          id: 'bookings',
          icon: 'orders-o',
          iconType: 'vant',
          text: t('common.quick.myReservation'),
          iconBg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
          iconColor: '#2563eb',
          cardBg: '#f8fbff',
        },
        {
          id: 'activities',
          icon: 'gift-o',
          iconType: 'vant',
          text: t('common.quick.activityList'),
          iconBg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
          iconColor: '#15803d',
          cardBg: '#f7fdf8',
        },
        {
          id: 'notifications',
          icon: 'chat-o',
          iconType: 'vant',
          text: t('common.quick.notificationCenter'),
          iconBg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          iconColor: '#b45309',
          cardBg: '#fffdf7',
        },
        {
          id: 'scan',
          icon: 'scan',
          iconType: 'vant',
          text: t('common.quick.scan'),
          iconBg: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
          iconColor: '#0284c7',
          cardBg: '#f7fcff',
        },
      ],
      displayBanners: [
        {
          image: '',
          title: t('openingHours.title'),
          activityId: '',
        },
      ],
    });
  },

  async loadSearchTags() {
    try {
      const [facilityRes, typeRes] = await Promise.all([
        getSeatFacilityConfigs(),
        getSeatTypeConfigs(),
      ]);
      const facilities = Array.isArray(facilityRes.data) ? facilityRes.data : [];
      const seatTypes = Array.isArray(typeRes.data) ? typeRes.data : [];

      const allTags = [
        ...facilities
          .filter((item: any) => item && item.enabled !== false && item.key)
          .map((item: any) =>
            buildSearchTagItem('facility', item.key, item.label || String(item.key), item.icon)
          ),
        ...seatTypes
          .filter((item: any) => item && item.enabled !== false && item.value)
          .map((item: any) =>
            buildSearchTagItem('seatType', item.value, item.label || String(item.value), item.icon)
          ),
      ];
      const tagMap = new Map<string, SearchTagItem>();
      allTags.forEach((item) => {
        if (!tagMap.has(item.key)) {
          tagMap.set(item.key, item);
        }
      });
      const tags = Array.from(tagMap.values());

      if (tags.length === 0) {
        this.setData({ searchTags: buildDefaultSearchTags() });
      } else {
        this.setData({ searchTags: tags });
      }
    } catch (error) {
      console.warn('加载搜索标签失败，使用默认标签', error);
      this.setData({ searchTags: buildDefaultSearchTags() });
    }
  },

  async loadSeatOverview() {
    const date = getToday();
    const timeSlot = getCurrentTimeSlot();

    try {
      const [overviewRes, floorsRes, seatTypeRes, seatFacilityRes, timeSlotRes]: any[] =
        await Promise.all([
          getSeatOverview({ date }, { showLoading: false }).catch(() => ({ data: null })),
          getFloors({ showLoading: false }),
          getSeatTypeConfigs().catch(() => ({ data: [] })),
          getSeatFacilityConfigs().catch(() => ({ data: [] })),
          getTimeSlotConfigs().catch(() => ({ data: [] })),
        ]);

      const seatTypeConfigs = Array.isArray(seatTypeRes?.data) ? seatTypeRes.data : [];
      const seatFacilityConfigs = Array.isArray(seatFacilityRes?.data) ? seatFacilityRes.data : [];
      const timeSlotConfigs = Array.isArray(timeSlotRes?.data) ? timeSlotRes.data : [];
      const openingInfo = resolveOpeningInfo(timeSlotConfigs);

      const seatTypeValueByCode = seatTypeConfigs
        .filter((item: any) => item && item.enabled !== false && item.value)
        .reduce(
          (acc: Record<string, string>, item: any) => {
            acc[String(item.type)] = String(item.value);
            return acc;
          },
          {} as Record<string, string>
        );
      const seatTypeLabelByValue = seatTypeConfigs
        .filter((item: any) => item && item.enabled !== false && item.value)
        .reduce(
          (acc: Record<string, string>, item: any) => {
            acc[String(item.value)] = String(item.label || item.value);
            return acc;
          },
          {} as Record<string, string>
        );

      const facilityLabelByKey = seatFacilityConfigs
        .filter((item: any) => item && item.enabled !== false && item.key)
        .reduce(
          (acc: Record<string, string>, item: any) => {
            acc[String(item.key)] = String(item.label || item.key);
            return acc;
          },
          {} as Record<string, string>
        );

      const powerLabel = facilityLabelByKey.power || 'power';
      const windowLabel = facilityLabelByKey.window || 'window';
      const overview = overviewRes?.data || {};
      const floorStats = Array.isArray(overview?.floorStats) ? overview.floorStats : [];

      const floorList = Array.isArray(floorsRes?.data?.list) ? floorsRes.data.list : [];
      const floors = floorList.sort((a: any, b: any) => compareFloorName(a?.name, b?.name));

      const seatResults = await Promise.all(
        floors.map((floor: any) =>
          getFloorSeats(String(floor.id), { date, timeSlot }, { showLoading: false }).then(
            (res: any) => ({
              floor,
              seats: Array.isArray(res.data?.seats) ? res.data.seats : [],
            })
          )
        )
      );

      const allSeats = seatResults.flatMap(({ floor, seats }) =>
        seats.map((seat: any) => ({
          ...seat,
          floorId: floor.id,
          floorName: floor.name,
        }))
      );

      const availableSeats = allSeats.filter(
        (seat) => String(seat.status) === '0' || seat.status === 'available'
      );
      const total = Number(overview?.totalSeats ?? allSeats.length ?? 0);
      const totalAvailableSeats = Number(overview?.availableSeats ?? availableSeats.length ?? 0);
      const totalBookedSeats = Number(overview?.occupiedSeats ?? 0);
      const totalMaintenanceSeats = Number(overview?.maintenanceSeats ?? 0);
      const safePercent = (value: number) => `${total ? Math.round((value / total) * 100) : 0}%`;

      const hottestFloor = floorStats.reduce(
        (result: any, current: any) =>
          Number(current?.occupiedSeats || 0) > Number(result?.occupiedSeats || 0)
            ? current
            : result,
        floorStats[0] || null
      );

      const favoriteIds = new Set<string>();
      if (getToken()) {
        try {
          const favRes: any = await getFavorites();
          const list = Array.isArray(favRes?.data?.list) ? favRes.data.list : [];
          list.forEach((item: any) => {
            if (item && item.id !== undefined) {
              favoriteIds.add(String(item.id));
            }
          });
        } catch (_error) {
          console.warn('获取收藏座位列表失败', _error);
        }
      }

      const seatList = availableSeats
        .sort(
          (a, b) =>
            Number(b.hasSocket) - Number(a.hasSocket) ||
            Number(b.isWindow) - Number(a.isWindow) ||
            compareSeatPosition(a, b)
        )
        .slice(0, 3)
        .map((seat: any) => {
          const typeCode = String(seat.type ?? '').trim();
          const typeValue =
            seatTypeValueByCode[typeCode] ||
            seatTypeValueByCode[String(Number(typeCode))] ||
            typeCode;
          const seatType = seatTypeLabelByValue[typeValue] || typeValue;

          const facilityKeys = [
            ...(seat.hasSocket ? ['power'] : []),
            ...(seat.isWindow ? ['window'] : []),
          ];
          const facilities = facilityKeys.map((key) => {
            if (key === 'power') return powerLabel;
            if (key === 'window') return windowLabel;
            return facilityLabelByKey[key] || key;
          });

          const distanceText = seat.description || facilities.join(' / ') || seat.zone || '';

          const seatLabel = seat.floorName || '';

          return {
            seatId: String(seat.id),
            seatLabel,
            seatName: `${seat.zone || 'Seat'} R${seat.row}C${seat.col}`,
            seatType,
            typeValue,
            distance: distanceText,
            attributes: [seatLabel, seatType, distanceText].filter(Boolean),
            statusText: t('common.status.available'),
            floor: seat.floorName || '',
            zone: seat.zone || '',
            facilities,
            facilityKeys,
            isFavorite: favoriteIds.has(String(seat.id)),
          };
        });

      const chartSource = floorStats.length
        ? floorStats.slice(0, 6)
        : seatResults.slice(0, 6).map((item) => ({
            floorName: item.floor?.name || '-',
            occupiedSeats: item.seats.filter(
              (seat: any) => String(seat.status) === '1' || seat.status === 'booked'
            ).length,
          }));
      const chartLabels = chartSource.map((item: any) => item.floorName || '-');
      const chartValues = chartSource.map((item: any) => Number(item.occupiedSeats || 0));

      this.setData({
        openingHoursTime: openingInfo.openingHoursTime,
        openingHoursStatus: openingInfo.openingHoursStatus,
        openingHoursTagType: openingInfo.openingHoursTagType,
        isReservableNow: openingInfo.isReservableNow,
        seatStatus: {
          total: { label: t('seatStatus.total'), value: String(total) },
          available: {
            label: t('seatStatus.available'),
            value: String(totalAvailableSeats),
            percent: safePercent(totalAvailableSeats),
          },
          reserved: {
            label: t('seatStatus.reserved'),
            value: String(totalBookedSeats),
            percent: safePercent(totalBookedSeats),
          },
          maintenance: {
            label: t('seatStatus.maintenance'),
            value: String(totalMaintenanceSeats),
            percent: safePercent(totalMaintenanceSeats),
          },
        },
        realTimeItems: [
          {
            icon: 'friends-o',
            label: t('realTime.users'),
            value: String(totalBookedSeats),
            sublabel: t('realTime.users.sublabel'),
            bgColor: '#e8f4ff',
            iconColor: '#409eff',
          },
          {
            icon: 'passed',
            label: t('seatStatus.available'),
            value: String(totalAvailableSeats),
            sublabel: safePercent(totalAvailableSeats),
            bgColor: '#e8f9f0',
            iconColor: '#2ecc71',
          },
          {
            icon: 'location-o',
            label: t('realTime.popular'),
            value: hottestFloor?.floorName || '-',
            sublabel: t('realTime.popular.sublabel'),
            bgColor: '#ffe8e8',
            iconColor: '#e74c3c',
          },
          {
            icon: 'underway-o',
            label: t('seatStatus.maintenance'),
            value: String(totalMaintenanceSeats),
            sublabel: safePercent(totalMaintenanceSeats),
            bgColor: '#f3f4f6',
            iconColor: '#64748b',
          },
          {
            icon: 'clock-o',
            label: t('realTime.booked'),
            value: String(totalBookedSeats),
            sublabel: `${getCurrentTimeSlotLabel(timeSlot, timeSlotConfigs)} / ${date}`,
            bgColor: '#f3e8ff',
            iconColor: '#9b59b6',
          },
          {
            icon: 'cluster-o',
            label: t('realTime.total'),
            value: String(total),
            sublabel: t('realTime.total.sublabel'),
            bgColor: '#e8f0ff',
            iconColor: '#3498db',
          },
        ],
        seatList,
      });

      this.renderChart(chartLabels, chartValues);
    } catch (_error) {
      wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
    }
  },

  async loadActivities() {
    try {
      const res: any = await getActivities();
      const list = Array.isArray(res?.data?.list) ? res.data.list : [];
      const userId = getApp<IAppOption>().globalData?.userInfo?.id || '';

      const activityList = list.slice(0, 4).map((activity: any) => {
        const participants = Array.isArray(activity.participants) ? activity.participants : [];
        const isJoined = participants.some(
          (item: any) => String(typeof item === 'string' ? item : item?.id || '') === String(userId)
        );
        const statusKey = String(activity.status);

        return {
          id: String(activity.id),
          title: activity.title || '-',
          desc: activity.description || t('common.empty.noDescription'),
          status: statusKey === '1' ? 'warning' : statusKey === '2' ? 'default' : 'primary',
          statusText:
            statusKey === '1'
              ? t('common.status.ongoing')
              : statusKey === '2'
                ? t('common.status.completed')
                : t('common.status.pending'),
          btnText: isJoined ? t('common.btn.detail') : t('activity.btn.register'),
          time: `${formatDate(activity.startTime)}${
            activity.endTime ? ` - ${formatDate(activity.endTime)}` : ''
          }`,
          disabled: statusKey === '2',
          isJoined,
          image: resolveAssetUrl(activity.coverImage),
        };
      });

      const banners = activityList
        .filter((item: any) => item.image)
        .slice(0, 3)
        .map((item: any) => ({
          image: item.image,
          title: item.title,
          activityId: item.id,
        }));

      this.setData({
        activityList,
        banners,
        displayBanners: banners.length
          ? banners
          : [
              {
                image: '',
                title: t('openingHours.title'),
                activityId: '',
              },
            ],
      });
    } catch (_error) {
      this.setData({
        activityList: [],
        banners: [],
        displayBanners: [
          {
            image: '',
            title: t('openingHours.title'),
            activityId: '',
          },
        ],
      });
    }
  },

  renderChart(labels: string[], values: number[]) {
    const ecCanvas = (this as any).selectComponent('#echart');
    if (!ecCanvas || !labels.length) return;

    ecCanvas.init((canvas: any, width: number, height: number, dpr: number) => {
      const chart = echarts.init(canvas as any, undefined, {
        width,
        height,
        devicePixelRatio: dpr,
      });

      chart.setOption({
        grid: {
          left: 12,
          right: 12,
          bottom: 12,
          top: 24,
          containLabel: true,
        },
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
          },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#e2e8f0' } },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 11 },
          splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
        },
        series: [
          {
            type: 'bar',
            data: values,
            barWidth: 18,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#409eff' },
                { offset: 1, color: '#67b8ff' },
              ]),
            },
          },
        ],
      });

      setTimeout(() => chart.resize(), 80);
      return chart;
    });
  },

  onSeatReserve(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.isReservableNow) {
      wx.showToast({ title: t('openingHours.closedHint'), icon: 'none' });
      return;
    }

    const { index } = e.currentTarget.dataset as { index?: number };
    const seatInfo = this.data.seatList[index || 0];
    if (!seatInfo) return;

    openReservationWithParams({
      seatId: seatInfo.seatId,
      seatName: seatInfo.seatName,
      zone: seatInfo.zone,
      floor: seatInfo.floor,
      type: seatInfo.seatType,
      typeValue: seatInfo.typeValue,
      typeLabel: seatInfo.seatType,
      facilityKeys: (seatInfo.facilityKeys || []).join(','),
      facilities: (seatInfo.facilities || []).join(','),
      date: getToday(),
    });
  },

  onSeatFavorite(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset as { index?: number };
    const seatInfo = this.data.seatList[index || 0];
    if (!seatInfo) return;
    if (!getToken()) {
      redirectToLogin();
      return;
    }

    favoriteSeat(String(seatInfo.seatId))
      .then(() => {
        const seatList = [...this.data.seatList];
        const nextInfo = { ...seatInfo, isFavorite: !seatInfo.isFavorite };
        seatList[index || 0] = nextInfo;
        this.setData({ seatList });

        wx.showToast({
          title: nextInfo.isFavorite ? t('common.btn.favorite') : t('common.btn.unfavorite'),
          icon: 'success',
        });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      });
  },

  onViewAllSeats() {
    if (!this.data.isReservableNow) {
      wx.showToast({ title: t('openingHours.closedHint'), icon: 'none' });
      return;
    }

    wx.switchTab({
      url: '/pages/reservation/reservation',
    });
  },

  onViewMoreActivities() {
    wx.navigateTo({
      url: '/pages/activity-list/activity-list',
    });
  },

  onActivityBtnTap(e: WechatMiniprogram.CustomEvent) {
    const activityId = String(e.detail?.dataset?.id || '');
    const activity = this.data.activityList.find((item: any) => String(item.id) === activityId);
    if (!activity) return;

    if (activity.isJoined || activity.disabled) {
      wx.navigateTo({
        url: `/pages/activity-detail/activity-detail?id=${activity.id}`,
      });
      return;
    }

    if (!getToken()) {
      redirectToLogin(`/pages/activity-detail/activity-detail?id=${activity.id}`);
      return;
    }

    wx.showModal({
      title: t('activity.confirm.registerTitle'),
      content: t('activity.confirm.registerContent'),
      success: (res) => {
        if (!res.confirm) return;
        joinActivity(String(activity.id))
          .then(() => {
            wx.showToast({ title: t('common.toast.registerSuccess'), icon: 'success' });
            this.loadActivities();
          })
          .catch(() => {
            wx.showToast({ title: t('common.toast.registerFailed'), icon: 'none' });
          });
      },
    });
  },

  onBannerTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id?: string };
    if (!id) return;
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${id}`,
    });
  },

  onSwitchLanguage() {
    const app = getApp<IAppOption>();
    if (app && app.switchLanguage) {
      const newLang = app.globalData.currentLang === 'zh' ? 'en' : 'zh';
      app.switchLanguage(newLang);
    }
  },

  onSearchConfirm(e: WechatMiniprogram.CustomEvent) {
    const keyword = String(e.detail || '').trim();
    if (!keyword) return;

    wx.navigateTo({
      url: `/pages/search-result/search-result?keyword=${encodeURIComponent(keyword)}`,
    });
  },

  onSearchTagTap(e: WechatMiniprogram.TouchEvent) {
    const tagValue = String(e.currentTarget.dataset.tagValue || '').trim();
    const tagType = String(e.currentTarget.dataset.tagType || '').trim();
    const tagLabel = String(e.currentTarget.dataset.tagLabel || '').trim();
    if (!tagValue || !tagType) return;

    wx.navigateTo({
      url:
        `/pages/search-result/search-result?keyword=${encodeURIComponent(tagLabel || tagValue)}` +
        `&tagType=${encodeURIComponent(tagType)}` +
        `&tagValue=${encodeURIComponent(tagValue)}`,
    });
  },

  async handleScanAction(requestedAction?: 'checkin' | 'checkout') {
    try {
      const result = await new Promise<WechatMiniprogram.ScanCodeSuccessCallbackResult>(
        (resolve, reject) => {
          wx.scanCode({
            onlyFromCamera: true,
            scanType: ['qrCode', 'barCode'],
            success: resolve,
            fail: reject,
          });
        }
      );

      const payload = this.parseScanPayload(result.result);
      if (!payload?.id) {
        wx.showToast({ title: t('common.hint.invalidQrCode'), icon: 'none' });
        return;
      }

      const effectiveAction = payload.action ? payload.action : requestedAction;

      if (payload.type === ScanPayloadType.ACTIVITY) {
        await this.handleActivityScan(payload, effectiveAction);
        return;
      }

      await this.handleBookingScan(payload, effectiveAction);
    } catch (error: any) {
      const errMsg = error?.message || (typeof error === 'string' ? error : t('common.hint.error'));
      wx.showToast({ title: errMsg, icon: 'none' });
    }
  },

  async handleBookingScan(
    payload: { type: ScanPayloadTypeValue; id: string; action?: string },
    requestedAction?: 'checkin' | 'checkout'
  ) {
    let action = payload.action as 'checkin' | 'checkout' | undefined;
    if (!action) action = requestedAction;

    if (!action) {
      const res: any = await getBookingDetail(payload.id);
      const booking = res?.data ?? res;
      const status = Number(booking?.status);
      if (status === 0) {
        action = 'checkin';
      } else if (status === 1) {
        action = 'checkout';
      } else if (status === 2) {
        wx.showToast({ title: t('common.hint.alreadyCheckedOut') || '已签到并签退', icon: 'none' });
        return;
      } else if (status === 4) {
        wx.showToast({
          title: t('common.hint.bookingViolated') || '预约已失效，无法操作',
          icon: 'none',
        });
        return;
      } else {
        wx.showToast({ title: t('common.hint.invalidQrCode'), icon: 'none' });
        return;
      }
    }

    if (action === 'checkin') {
      const res: any = await getBookingDetail(payload.id);
      const booking = res?.data ?? res;
      if (Number(booking?.status) === 1) {
        wx.showToast({
          title: t('common.hint.alreadyCheckedIn') || '已签到，无需重复扫码',
          icon: 'none',
        });
        return;
      }
      await checkin(payload.id);
      wx.showToast({ title: t('common.hint.checkInSuccess'), icon: 'success' });
      return;
    }

    if (action === 'checkout') {
      const res: any = await getBookingDetail(payload.id);
      const booking = res?.data ?? res;
      const status = Number(booking?.status);
      if (status === 0) {
        wx.showToast({
          title: t('common.hint.cannotCheckoutBeforeCheckin') || '尚未签到，无法签退',
          icon: 'none',
        });
        return;
      }
      if (status === 2) {
        wx.showToast({
          title: t('common.hint.alreadyCheckedOut') || '已签退，操作已完成',
          icon: 'none',
        });
        return;
      }
      if (status === 4) {
        wx.showToast({
          title: t('common.hint.bookingViolated') || '预约已失效，无法操作',
          icon: 'none',
        });
        return;
      }
      await checkout(payload.id);
      wx.showToast({ title: t('common.hint.checkOutSuccess'), icon: 'success' });
      return;
    }
  },

  async handleActivityScan(
    payload: { type: ScanPayloadTypeValue; id: string; action?: 'checkin' | 'checkout' },
    requestedAction?: 'checkin' | 'checkout'
  ) {
    const activityId = payload.id;
    const activityRes: any = await getActivityDetail(activityId);
    const activity = activityRes?.data ?? activityRes;
    const currentUserId = getUserInfo()?.id || '';
    let action = payload.action as 'checkin' | 'checkout' | undefined;
    if (!action) action = requestedAction;

    const checkedIn = Array.isArray(activity?.checkedIn) ? activity.checkedIn : [];
    const checkedOut = Array.isArray(activity?.checkedOut) ? activity.checkedOut : [];
    const isCheckedIn = checkedIn.some((item: any) => String(item) === String(currentUserId));
    const isCheckedOut = checkedOut.some((item: any) => String(item) === String(currentUserId));

    if (!action) {
      if (Number(activity?.status) === 0) {
        wx.showToast({
          title: t('common.hint.activityNotStarted') || '活动未开始，无法签到',
          icon: 'none',
        });
        return;
      }
      if (isCheckedOut) {
        wx.showToast({
          title: t('common.hint.alreadyCheckedOut') || '已签退，操作已完成',
          icon: 'none',
        });
        return;
      }
      action = isCheckedIn ? 'checkout' : 'checkin';
    }

    if (action === 'checkin') {
      if (Number(activity?.status) !== 1) {
        wx.showToast({
          title: t('common.hint.activityCannotCheckIn') || '当前活动不支持签到',
          icon: 'none',
        });
        return;
      }
      if (isCheckedIn) {
        wx.showToast({
          title: t('common.hint.alreadyCheckedIn') || '已签到，无需重复扫码',
          icon: 'none',
        });
        return;
      }
      await checkinActivity(payload.id);
      wx.showToast({ title: t('common.hint.checkInSuccess'), icon: 'success' });
      return;
    }

    if (action === 'checkout') {
      if (Number(activity?.status) === 0) {
        wx.showToast({
          title: t('common.hint.activityNotStarted') || '活动未开始，无法签退',
          icon: 'none',
        });
        return;
      }
      if (!isCheckedIn) {
        wx.showToast({
          title: t('common.hint.activityNotCheckedIn') || '尚未签到，无法签退',
          icon: 'none',
        });
        return;
      }
      if (isCheckedOut) {
        wx.showToast({
          title: t('common.hint.alreadyCheckedOut') || '已签退，操作已完成',
          icon: 'none',
        });
        return;
      }
      await checkoutActivity(payload.id);
      wx.showToast({ title: t('common.hint.checkOutSuccess'), icon: 'success' });
      return;
    }

    wx.showToast({ title: t('common.hint.invalidQrCode'), icon: 'none' });
  },

  parseScanPayload(result: string) {
    if (!result) return null;

    const raw = result.trim();
    const payload: { type: ScanPayloadTypeValue; id: string; action?: 'checkin' | 'checkout' } = {
      type: ScanPayloadType.BOOKING,
      id: '',
    };

    if (/^\d+$/.test(raw)) {
      payload.id = raw;
      return payload;
    }

    const tryParseJson = (text: string) => {
      if (!text.startsWith('{') && !text.startsWith('[')) return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    const json = tryParseJson(raw);
    if (json) {
      const id = json.bookingId || json.activityId || json.id || json.data?.id;
      const typeRaw = json.type || json.entity;
      const action = String(json.action || '').toLowerCase();
      if (id) {
        payload.id = String(id);
        payload.type = parseScanPayloadType(typeRaw);
        if (action === 'checkin' || action === 'checkout') {
          payload.action = action;
        }
        return payload;
      }
    }

    try {
      const url = new URL(raw);
      const queryType = String(
        url.searchParams.get('type') || url.searchParams.get('entity') || ''
      ).toLowerCase();
      const queryAction = String(url.searchParams.get('action') || '').toLowerCase();
      const id =
        url.searchParams.get('activityId') ||
        url.searchParams.get('bookingId') ||
        url.searchParams.get('id');
      if (id) {
        payload.id = String(id);
        payload.type = parseScanPayloadType(queryType);
        if (queryAction === 'checkin' || queryAction === 'checkout') {
          payload.action = queryAction;
        }
        return payload;
      }
    } catch {
      // ignore invalid url
    }

    const typeMatch = raw.match(/(?:type|entity)=([^&]+)/i);
    const actionMatch = raw.match(/(?:action)=([^&]+)/i);
    const idMatch = raw.match(/(?:activityId|bookingId|id)=([^&]+)/i);
    if (idMatch) {
      payload.id = idMatch[1];
      const typeValue = typeMatch?.[1];
      const actionValue = actionMatch?.[1]?.toLowerCase();
      payload.type = parseScanPayloadType(typeValue);
      if (actionValue === 'checkin' || actionValue === 'checkout') {
        payload.action = actionValue;
      }
      return payload;
    }

    return null;
  },

  onActionCardTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id?: string };

    if (id === 'requests') {
      wx.navigateTo({
        url: '/pages/my-requests/my-requests',
      });
      return;
    }

    if (!getToken()) {
      redirectToLogin();
      return;
    }

    if (id === 'scan') {
      this.handleScanAction();
      return;
    }

    if (id === 'bookings') {
      wx.navigateTo({
        url: '/pages/my-reservation/my-reservation',
      });
      return;
    }

    if (id === 'activities') {
      wx.navigateTo({
        url: '/pages/activity-list/activity-list',
      });
      return;
    }

    if (id === 'notifications') {
      wx.switchTab({
        url: '/pages/notification/notification',
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/my-reservation/my-reservation',
    });
  },
});
