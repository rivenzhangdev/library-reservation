import { getSeatDetail } from '../../apis/seats';
import { favoriteSeat, getFavorites } from '../../apis/user';
import { openReservationWithParams } from '../../utils/reservationNavigator';
import { getToday } from '../../utils/time';
import { isLogin, redirectToLogin } from '../../utils/auth';
import { t, getLangClassName } from '../../utils/i18n';
import { getFallbackTimeSlotConfigs } from '../../utils/time-slot';

const TIME_SLOT_INFO = getFallbackTimeSlotConfigs().map((item) => ({
  value: String(item.slot),
  label: item.label,
  range: `${item.startTime} - ${item.endTime}`,
}));

function normalizeSlotStatus(source: any) {
  const rawValue = String(source ?? '0');
  if (rawValue === '1') return 'booked';
  if (rawValue === '2') return 'maintenance';
  return 'available';
}

function normalizeSeatStatus(source: any) {
  const rawValue = String(source ?? '0');
  if (rawValue === '1') return 'maintenance';
  return 'available';
}

function buildFacilityLabels(detail: any) {
  const facilities: string[] = Array.isArray(detail.facilities) ? [...detail.facilities] : [];
  if (detail.hasSocket && !facilities.includes(t('common.seat.facilities.power'))) {
    facilities.push(t('common.seat.facilities.power'));
  }
  if (detail.isWindow && !facilities.includes(t('common.seat.facilities.window'))) {
    facilities.push(t('common.seat.facilities.window'));
  }
  return facilities;
}

function buildTypeLabel(detail: any) {
  const explicit = String(detail.typeLabel || detail.typeName || '').trim();
  if (explicit) return explicit;

  const typeMap: Record<string, string> = {
    '0': t('reservation.seatType.single'),
    '1': t('reservation.seatType.double'),
    '2': t('reservation.seatType.group'),
  };
  const key = String(detail.type ?? '');
  return typeMap[key] || key || t('common.field.type');
}

function getSeatName(detail: any) {
  const parts = [detail.floorName, detail.zone];
  if (detail.row !== undefined && detail.col !== undefined) {
    parts.push(`R${detail.row}C${detail.col}`);
  }
  return parts.filter(Boolean).join(' ');
}

function buildSlotStatusList(timeSlotStatus: any) {
  return TIME_SLOT_INFO.map((slot) => {
    const status = normalizeSlotStatus(timeSlotStatus?.[slot.value]);
    const statusText = t(`common.status.${status}`);
    const tagType =
      status === 'available' ? 'success' : status === 'booked' ? 'warning' : 'default';
    return {
      value: slot.value,
      label: slot.label,
      range: slot.range,
      status,
      statusText,
      tagType,
    };
  });
}

function findFirstAvailableSlot(timeSlotStatus: any) {
  const slotStatuses = buildSlotStatusList(timeSlotStatus);
  return slotStatuses.find((slot) => slot.status === 'available');
}

function buildBookingRecords(bookings: any[]) {
  return bookings.map((item: any, index: number) => {
    const startTime = String(item.startTime || '').trim() || '00:00';
    const endTime = String(item.endTime || '').trim() || '00:00';
    return {
      id: `${item.timeSlot ?? index}-${startTime}-${endTime}`,
      timeRange: `${startTime} - ${endTime}`,
      label: t('common.status.booked'),
    };
  });
}

Page({
  data: {
    seatId: '',
    seat: null as any,
    isFavorite: false,
    favoriteActionActive: false,
    slotStatusList: [] as any[],
    bookings: [] as any[],
    todayBookingSummary: '',
    isSeatAvailable: false,
    reserveTargetSlot: null as any,
    reserveButtonText: '',
    reserveNoticeText: '',
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    reserveText: '',
    favoriteText: '',
    unfavoriteText: '',
    sectionBasicLabel: '',
    sectionAvailabilityLabel: '',
    sectionBookingLabel: '',
    noBookingsText: '',
    floorLabel: '',
    zoneLabel: '',
    positionLabel: '',
    typeLabel: '',
    descriptionLabel: '',
    facilitiesLabel: '',
    statusLabel: '',
    commonNoDescription: '',
    mineTagText: '',
  },

  onLoad(options: any) {
    const seatId = String(options.id || '');
    this.setData({ seatId });
    this.updateLanguage();
    if (seatId) {
      this.loadSeatDetail(seatId);
      this.loadFavoriteState(seatId);
    }
  },

  onShow() {
    const app = getApp<IAppOption>();
    const currentLang = app.globalData?.currentLang || 'zh';
    if (currentLang !== this.data.currentLang) {
      this.updateLanguage();
    }
    if (this.data.seatId) {
      this.loadSeatDetail(this.data.seatId);
      this.loadFavoriteState(this.data.seatId);
    }
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    const currentLang = app.globalData?.currentLang || 'zh';
    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('common.page.seatDetail.title'),
      reserveText: t('common.page.seatDetail.reserveNow'),
      favoriteText: t('common.page.seatDetail.favorite'),
      unfavoriteText: t('common.page.seatDetail.unfavorite'),
      sectionBasicLabel: t('common.page.seatDetail.basicInfo'),
      sectionAvailabilityLabel: t('common.page.seatDetail.todayAvailability'),
      sectionBookingLabel: t('common.field.todayBookings'),
      todayBookingSummary: '',
      isSeatAvailable: false,
      reserveButtonText: t('common.page.seatDetail.reserveNow'),
      reserveNoticeText: '',
      noBookingsText: t('common.hint.noBookingsToday'),
      floorLabel: t('common.field.floor'),
      zoneLabel: t('common.field.zone'),
      positionLabel: t('common.field.seatCode'),
      typeLabel: t('common.field.type'),
      descriptionLabel: t('common.field.description'),
      facilitiesLabel: t('common.field.facilities'),
      statusLabel: t('common.field.status'),
      commonNoDescription: t('common.empty.noDescription'),
      mineTagText: t('common.page.seatDetail.mineTag'),
    });
  },

  loadSeatDetail(seatId: string) {
    wx.showLoading({ title: t('common.hint.loading') });
    getSeatDetail(seatId, { date: getToday() })
      .then((res: any) => {
        const detail = res?.data || {};
        const seat = {
          id: String(detail.id || ''),
          name: getSeatName(detail),
          floorName: String(detail.floorName || ''),
          zone: String(detail.zone || ''),
          position:
            detail.row !== undefined && detail.col !== undefined
              ? `R${detail.row}C${detail.col}`
              : '',
          typeLabel: buildTypeLabel(detail),
          facilities: buildFacilityLabels(detail),
          description: String(detail.description || ''),
          status: normalizeSeatStatus(detail.status),
          statusText: t(`common.status.${normalizeSeatStatus(detail.status)}`),
          statusTag: normalizeSeatStatus(detail.status) === 'available' ? 'success' : 'default',
          isMine: detail.isMine === true,
        };

        const bookings = Array.isArray(detail.bookings) ? detail.bookings : [];
        const bookingCount = bookings.length;
        const todayBookingSummary = bookingCount
          ? t('common.page.seatDetail.bookingCount', { count: bookingCount })
          : '';
        const isSeatAvailable = seat.status === 'available';
        const availableSlot = findFirstAvailableSlot(detail.timeSlotStatus);
        const reserveButtonText = isSeatAvailable
          ? t('common.page.seatDetail.reserveNow')
          : seat.status === 'maintenance'
            ? t('common.page.seatDetail.maintenanceButton')
            : t('common.page.seatDetail.bookedButton');
        const reserveNoticeText = isSeatAvailable
          ? t('common.page.seatDetail.reserveHint')
          : seat.status === 'maintenance'
            ? t('common.page.seatDetail.reserveMaintenanceHint')
            : t('common.page.seatDetail.reserveUnavailableHint');

        this.setData({
          seat,
          slotStatusList: buildSlotStatusList(detail.timeSlotStatus),
          bookings: buildBookingRecords(bookings),
          todayBookingSummary,
          isSeatAvailable,
          reserveButtonText,
          reserveNoticeText,
          reserveTargetSlot: availableSlot || null,
        });
      })
      .catch(() => {
        this.setData({ seat: null, slotStatusList: [], bookings: [] });
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  async loadFavoriteState(seatId: string) {
    if (!isLogin()) {
      this.setData({ isFavorite: false });
      return;
    }

    try {
      const res: any = await getFavorites();
      const favorites = Array.isArray(res?.data?.list) ? res.data.list : [];
      const favoriteIds = new Set(favorites.map((item: any) => String(item.id)));
      this.setData({ isFavorite: favoriteIds.has(String(seatId)) });
    } catch (error) {
      console.warn('loadFavoriteState failed', error);
    }
  },

  onToggleFavorite() {
    if (!isLogin()) {
      redirectToLogin(`/pages/seat-detail/seat-detail?id=${this.data.seatId}`);
      return;
    }

    favoriteSeat(this.data.seatId)
      .then(() => {
        const nextFavorite = !this.data.isFavorite;
        this.setData({
          isFavorite: nextFavorite,
          favoriteActionActive: true,
        });
        wx.showToast({
          title: nextFavorite ? this.data.favoriteText : this.data.unfavoriteText,
          icon: 'success',
        });
        setTimeout(() => {
          this.setData({ favoriteActionActive: false });
        }, 220);
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      });
  },

  onReserve() {
    const seat = this.data.seat;
    if (!seat || !this.data.isSeatAvailable) return;

    const payload: Record<string, any> = {
      seatId: seat.id,
      seatName: seat.name,
      zone: seat.zone,
      floor: seat.floorName,
      typeLabel: seat.typeLabel,
      facilities: Array.isArray(seat.facilities) ? seat.facilities.join(',') : '',
      date: getToday(),
    };

    const reserveTargetSlot = this.data.reserveTargetSlot;
    if (reserveTargetSlot) {
      payload.timeSlotId = reserveTargetSlot.value;
      payload.timeSlotName = reserveTargetSlot.label;
      payload.startTime = reserveTargetSlot.range.split(' - ')[0] || '';
      payload.endTime = reserveTargetSlot.range.split(' - ')[1] || '';
    }

    openReservationWithParams(payload);
  },
});
