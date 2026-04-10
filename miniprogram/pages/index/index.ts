// @ts-ignore
import * as echarts from '../../components/ec-canvas/echarts.min';
import {
  getActivities,
  joinActivity,
  checkinActivity,
  checkoutActivity,
  getActivityDetail,
} from '../../apis/activity';
import { getFloors, getFloorSeats } from '../../apis/seats';
import { favoriteSeat } from '../../apis/user';
import { checkin, checkout, getBookingDetail } from '../../apis/booking';
import { getToken, redirectToLogin, getUserInfo } from '../../utils/auth';
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
          id: 'scan',
          icon: 'scan',
          iconType: 'vant',
          text: t('actions.scan'),
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

      if (payload.type === 'activity') {
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
    payload: { type: 'booking' | 'activity'; id: string; action?: string },
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
      await checkout(payload.id);
      wx.showToast({ title: t('common.hint.checkOutSuccess'), icon: 'success' });
      return;
    }

    wx.showToast({ title: t('common.hint.invalidQrCode'), icon: 'none' });
  },

  async handleActivityScan(
    payload: { type: 'booking' | 'activity'; id: string; action?: string },
    requestedAction?: 'checkin' | 'checkout'
  ) {
    let action = payload.action as 'checkin' | 'checkout' | undefined;
    if (!action) action = requestedAction;

    const res: any = await getActivityDetail(payload.id);
    const activity = res?.data ?? res;
    const currentUserId = getApp<IAppOption>().globalData?.userInfo?.id || getUserInfo()?.id || '';
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
    const payload: { type: 'booking' | 'activity'; id: string; action?: 'checkin' | 'checkout' } = {
      type: 'booking',
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
      const type = String(json.type || json.entity || '').toLowerCase();
      const action = String(json.action || '').toLowerCase();
      if (id) {
        payload.id = String(id);
        if (type === 'activity' || String(json.type) === 'activity') {
          payload.type = 'activity';
        }
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
        if (queryType === 'activity') payload.type = 'activity';
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
      const typeValue = typeMatch?.[1]?.toLowerCase();
      const actionValue = actionMatch?.[1]?.toLowerCase();
      if (typeValue === 'activity') payload.type = 'activity';
      if (actionValue === 'checkin' || actionValue === 'checkout') {
        payload.action = actionValue;
      }
      return payload;
    }

    return null;
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
