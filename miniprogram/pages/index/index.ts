// @ts-ignore
import * as echarts from '../../components/ec-canvas/echarts.min';
import { getActivities, joinActivity } from '../../apis/activity';
import { getFloors, getFloorSeats } from '../../apis/seats';
import { favoriteSeat } from '../../apis/user';
import { checkin, checkout } from '../../apis/booking';
import { getToken, redirectToLogin } from '../../utils/auth';
import { resolveAssetUrl } from '../../utils/assets';
import { t } from '../../utils/i18n';
import { openReservationWithParams } from '../../utils/reservationNavigator';
import { compareFloorName, compareSeatPosition } from '../../utils/sort';

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTimeSlot() {
  const hour = new Date().getHours();
  if (hour >= 18) return 2;
  if (hour >= 13) return 1;
  return 0;
}

function getCurrentTimeSlotLabel() {
  const slot = getCurrentTimeSlot();
  if (slot === 2) return t('reservation.time.period.evening');
  if (slot === 1) return t('reservation.time.period.afternoon');
  return t('reservation.time.period.morning');
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
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
    seatStatusTitle: '',
    realTimeTitle: '',
    recommendTitle: '',
    reserveButtonText: '',
    viewAllText: '',
    activityTitle: '',
    viewMoreActivity: '',
    searchTags: [] as string[],
    actionCards: [] as Array<{
      id: string;
      icon: string;
      iconType: 'vant' | 'iconfont';
      text: string;
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
    this.loadSeatOverview();
    this.loadActivities();
  },

  onShow() {
    this.updateLanguage();
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
      openingHoursStatus: t('openingHours.status'),
      seatStatusTitle: t('seatStatus.title'),
      realTimeTitle: t('realTime.title'),
      recommendTitle: t('recommend.title'),
      reserveButtonText: t('common.btn.reserve'),
      viewAllText: t('common.btn.viewAll'),
      activityTitle: t('activity.title'),
      viewMoreActivity: t('common.btn.viewMore'),
      searchTags: [
        t('search.tags.power'),
        t('search.tags.window'),
        t('search.tags.single'),
        t('search.tags.double'),
        t('search.tags.group'),
      ],
      actionCards: [
        {
          id: 'reserve',
          icon: 'shopping-cart-o',
          iconType: 'vant',
          text: t('common.btn.reserve'),
        },
        {
          id: 'bookings',
          icon: 'orders-o',
          iconType: 'vant',
          text: t('actions.myReservation'),
        },
        {
          id: 'renew',
          icon: 'replay',
          iconType: 'vant',
          text: t('actions.renew'),
        },
        {
          id: 'checkin',
          icon: 'scan',
          iconType: 'vant',
          text: t('actions.checkin'),
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

  async loadSeatOverview() {
    const date = getToday();
    const timeSlot = getCurrentTimeSlot();

    try {
      const floorsRes: any = await getFloors({ showLoading: false });
      const floors = (Array.isArray(floorsRes.data) ? floorsRes.data : []).sort((a: any, b: any) =>
        compareFloorName(a?.name, b?.name)
      );

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

      const total = allSeats.length;
      const availableSeats = allSeats.filter(
        (seat) => String(seat.status) === '0' || seat.status === 'available'
      );
      const bookedSeats = allSeats.filter(
        (seat) => String(seat.status) === '1' || seat.status === 'booked'
      );
      const maintenanceSeats = allSeats.filter(
        (seat) => String(seat.status) === '2' || seat.status === 'maintenance'
      );
      const safePercent = (value: number) => `${total ? Math.round((value / total) * 100) : 0}%`;

      const hottestFloor = seatResults.reduce(
        (result, current) => {
          const currentBooked = current.seats.filter(
            (seat: any) => String(seat.status) === '1' || seat.status === 'booked'
          ).length;
          const resultBooked = result.seats.filter(
            (seat: any) => String(seat.status) === '1' || seat.status === 'booked'
          ).length;
          return currentBooked > resultBooked ? current : result;
        },
        seatResults[0] || { floor: { name: '-' }, seats: [] }
      );

      const seatList = availableSeats
        .sort(
          (a, b) =>
            Number(b.hasSocket) - Number(a.hasSocket) ||
            Number(b.isWindow) - Number(a.isWindow) ||
            compareSeatPosition(a, b)
        )
        .slice(0, 3)
        .map((seat: any) => ({
          seatId: String(seat.id),
          seatLabel: seat.floorName || '-',
          seatName: `${seat.zone || 'Seat'} R${seat.row}C${seat.col}`,
          seatType:
            String(seat.type) === '1'
              ? t('seat.type.double')
              : String(seat.type) === '2'
                ? t('reservation.seatType.group')
                : t('seat.type.single'),
          distance:
            seat.description ||
            [
              seat.hasSocket ? t('common.seat.facilities.power') : '',
              seat.isWindow ? t('common.seat.facilities.window') : '',
            ]
              .filter(Boolean)
              .join(' / ') ||
            seat.zone ||
            '-',
          statusText: t('common.status.available'),
          floor: seat.floorName || '',
          zone: seat.zone || '',
          facilities: [
            ...(seat.hasSocket ? [t('common.seat.facilities.power')] : []),
            ...(seat.isWindow ? [t('common.seat.facilities.window')] : []),
          ],
        }));

      const chartLabels = seatResults.slice(0, 6).map((item) => item.floor?.name || '-');
      const chartValues = seatResults
        .slice(0, 6)
        .map(
          (item) =>
            item.seats.filter(
              (seat: any) => String(seat.status) === '1' || seat.status === 'booked'
            ).length
        );

      this.setData({
        seatStatus: {
          total: { label: t('seatStatus.total'), value: String(total) },
          available: {
            label: t('seatStatus.available'),
            value: String(availableSeats.length),
            percent: safePercent(availableSeats.length),
          },
          reserved: {
            label: t('seatStatus.reserved'),
            value: String(bookedSeats.length),
            percent: safePercent(bookedSeats.length),
          },
          maintenance: {
            label: t('seatStatus.maintenance'),
            value: String(maintenanceSeats.length),
            percent: safePercent(maintenanceSeats.length),
          },
        },
        realTimeItems: [
          {
            icon: 'friends-o',
            label: t('realTime.users'),
            value: String(bookedSeats.length),
            sublabel: t('realTime.users.sublabel'),
            bgColor: '#e8f4ff',
            iconColor: '#409eff',
          },
          {
            icon: 'passed',
            label: t('seatStatus.available'),
            value: String(availableSeats.length),
            sublabel: safePercent(availableSeats.length),
            bgColor: '#e8f9f0',
            iconColor: '#2ecc71',
          },
          {
            icon: 'location-o',
            label: t('realTime.popular'),
            value: hottestFloor?.floor?.name || '-',
            sublabel: t('realTime.popular.sublabel'),
            bgColor: '#ffe8e8',
            iconColor: '#e74c3c',
          },
          {
            icon: 'underway-o',
            label: t('seatStatus.maintenance'),
            value: String(maintenanceSeats.length),
            sublabel: safePercent(maintenanceSeats.length),
            bgColor: '#f3f4f6',
            iconColor: '#64748b',
          },
          {
            icon: 'clock-o',
            label: t('realTime.booked'),
            value: String(bookedSeats.length),
            sublabel: `${getCurrentTimeSlotLabel()} / ${date}`,
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
    if (!getToken()) {
      this.setData({ banners: [], activityList: [] });
      return;
    }

    try {
      const res: any = await getActivities();
      const list = Array.isArray(res.data)
        ? res.data
        : res?.data?.list || res?.data?.activities || [];
      const userId = getApp<IAppOption>().globalData?.userInfo?.id || '';

      const activityList = list.slice(0, 4).map((activity: any) => {
        const participants = Array.isArray(activity.participants) ? activity.participants : [];
        const isJoined = participants.some(
          (item: any) =>
            String(typeof item === 'string' ? item : item?._id || item?.id || '') === String(userId)
        );
        const statusKey = String(activity.status);

        return {
          id: String(activity._id || activity.id),
          title: activity.title || '-',
          desc: activity.description || t('common.empty.noDescription'),
          status: statusKey === '1' ? 'warning' : statusKey === '2' ? 'default' : 'primary',
          statusText:
            statusKey === '1'
              ? t('common.status.ongoing')
              : statusKey === '2'
                ? t('common.status.completed')
                : t('common.status.pending'),
          btnText: isJoined ? t('activity.btn.detail') : t('common.btn.confirm'),
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
              borderRadius: [8, 8, 0, 0],
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
    const { index } = e.currentTarget.dataset as { index?: number };
    const seatInfo = this.data.seatList[index || 0];
    if (!seatInfo) return;

    openReservationWithParams({
      seatId: seatInfo.seatId,
      seatName: seatInfo.seatName,
      zone: seatInfo.zone,
      floor: seatInfo.floor,
      type: seatInfo.seatType,
      facilities: (seatInfo.facilities || []).join(','),
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
        wx.showToast({ title: t('common.btn.favorite'), icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      });
  },

  onViewAllSeats() {
    wx.switchTab({
      url: '/pages/reservation/reservation',
    });
  },

  onViewMoreActivities() {
    wx.navigateTo({
      url: '/pages/my-activity/my-activity',
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

    wx.showModal({
      title: t('activity.confirm.registerTitle'),
      content: t('activity.confirm.registerContent'),
      success: (res) => {
        if (!res.confirm) return;
        joinActivity(String(activity.id))
          .then(() => {
            wx.showToast({ title: t('activity.toast.registerSuccess'), icon: 'success' });
            this.loadActivities();
          })
          .catch(() => {
            wx.showToast({ title: t('activity.toast.registerFailed'), icon: 'none' });
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
    const tag = String(e.currentTarget.dataset.tag || '').trim();
    if (!tag) return;

    wx.navigateTo({
      url: `/pages/search-result/search-result?keyword=${encodeURIComponent(tag)}`,
    });
  },

  async handleScanAction(action: 'checkin' | 'checkout') {
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

      const bookingId = this.parseBookingIdFromScanResult(result.result);
      if (!bookingId) {
        wx.showToast({ title: t('common.hint.invalidQrCode'), icon: 'none' });
        return;
      }

      if (action === 'checkin') {
        await checkin(bookingId);
        wx.showToast({ title: t('common.hint.checkInSuccess'), icon: 'success' });
      } else {
        await checkout(bookingId);
        wx.showToast({ title: t('common.hint.checkOutSuccess'), icon: 'success' });
      }
    } catch (error: any) {
      const errMsg = error?.message || t('common.hint.error');
      wx.showToast({ title: errMsg, icon: 'none' });
    }
  },

  parseBookingIdFromScanResult(result: string) {
    if (!result) return '';

    let encoded = result.trim();
    if (/^\d+$/.test(encoded)) return encoded;

    if (encoded.startsWith('{') || encoded.startsWith('[')) {
      try {
        const parsed = JSON.parse(encoded);
        if (parsed?.bookingId) return String(parsed.bookingId);
        if (parsed?.id) return String(parsed.id);
      } catch {
        // ignore
      }
    }

    try {
      const url = new URL(encoded);
      const id = url.searchParams.get('bookingId') || url.searchParams.get('id');
      if (id) return String(id);
    } catch {
      // ignore
    }

    const match = encoded.match(/(?:bookingId|id)=([^&]+)/i);
    if (match) return match[1];
    return '';
  },

  onActionCardTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id?: string };

    if (id === 'reserve') {
      wx.switchTab({ url: '/pages/reservation/reservation' });
      return;
    }

    if (!getToken()) {
      redirectToLogin();
      return;
    }

    if (id === 'checkin') {
      this.handleScanAction('checkin');
      return;
    }

    if (id === 'bookings') {
      wx.navigateTo({
        url: '/pages/my-reservation/my-reservation',
      });
      return;
    }

    if (id === 'renew') {
      wx.navigateTo({
        url: '/pages/my-reservation/my-reservation?quickAction=renew',
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/my-reservation/my-reservation',
    });
  },
});
