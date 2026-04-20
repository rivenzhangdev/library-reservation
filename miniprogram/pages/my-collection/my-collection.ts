import { t, getLangClassName } from '../../utils/i18n';
import { getFavorites, favoriteSeat } from '../../apis/user';
import { getMyBookings } from '../../apis/booking';
import { isLogin, redirectToLogin } from '../../utils/auth';
import { openReservationWithParams } from '../../utils/reservationNavigator';
import { sortBySeatPosition } from '../../utils/sort';
import { getToday } from '../../utils/time';

function getStatusText(status: string) {
  const map: Record<string, string> = {
    available: t('common.status.available'),
    booked: t('common.status.booked'),
    maintenance: t('common.status.maintenance'),
  };
  return map[status] || t('common.status.available');
}

Page({
  data: {
    favoriteSeats: [] as any[],
    favoriteTimeSlots: [] as any[],
    totalCount: 0,
    favoriteSeatsCount: 0,
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    emptySeatHint: '',
    emptyTimeSlotHint: '',
    favoriteSeatsTitle: '',
    favoriteTimeSlotsTitle: '',
    frequencyLabel: '',
    selectText: '',
    quickReserveText: '',
  },

  onLoad() {
    this.initLanguage();
    this.loadFavorites();
  },

  onShow() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    if (currentLang !== this.data.currentLang) {
      this.initLanguage();
    }
    this.loadFavorites();
  },

  initLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('myCollection.title'),
      emptySeatHint: t('myCollection.empty.seat'),
      emptyTimeSlotHint: t('myCollection.empty.timeSlot'),
      favoriteSeatsTitle: t('myCollection.favoriteSeats'),
      favoriteTimeSlotsTitle: t('myCollection.favoriteTimeSlots'),
      frequencyLabel: t('myCollection.frequency'),
      selectText: t('myCollection.action.select'),
      quickReserveText: t('myCollection.action.quickReserve'),
    });
  },

  loadFavorites() {
    if (!isLogin()) {
      redirectToLogin('/pages/my-collection/my-collection');
      return;
    }

    wx.showLoading({ title: t('common.hint.loading') });

    Promise.all([getFavorites(), getMyBookings({ page: 1, pageSize: 50 })])
      .then(([favoritesRes, bookingsRes]: any) => {
        const seats = Array.isArray(favoritesRes?.data?.list) ? favoritesRes.data.list : [];
        const bookings = Array.isArray(bookingsRes?.data?.list) ? bookingsRes.data.list : [];
        const seatTypeMap: Record<string, string> = {
          '0': t('reservation.seatType.single'),
          '1': t('reservation.seatType.double'),
          '2': t('reservation.seatType.group'),
        };
        const statusMap: Record<string, string> = {
          '0': 'available',
          '1': 'booked',
          '2': 'maintenance',
          available: 'available',
          booked: 'booked',
          maintenance: 'maintenance',
        };

        const favoriteSeats = sortBySeatPosition(
          seats.map((seat: any) => {
            const facilities = [
              ...(seat.hasSocket ? [t('common.seat.facilities.power')] : []),
              ...(seat.isWindow ? [t('common.seat.facilities.window')] : []),
            ];
            const status = statusMap[String(seat.status)] || 'available';
            return {
              id: String(seat.id),
              seatName:
                `${seat.floorName || ''} ${seat.zone || ''} R${seat.rowNum}C${seat.colNum}`.trim(),
              zone: seat.zone || '',
              floor: seat.floorName || '',
              floorName: seat.floorName || '',
              rowNum: seat.rowNum,
              colNum: seat.colNum,
              type: seatTypeMap[String(seat.type)] || t('reservation.seatType.single'),
              facilities,
              status,
              statusText: getStatusText(status),
            };
          })
        );

        const grouped = bookings.reduce((acc: Record<string, any>, booking: any) => {
          const timeSlot = String(booking.timeSlot ?? '');
          const config: Record<string, { name: string; startTime: string; endTime: string }> = {
            '0': {
              name: t('reservation.time.period.morning'),
              startTime: booking.startTime || '08:00',
              endTime: booking.endTime || '12:00',
            },
            '1': {
              name: t('reservation.time.period.afternoon'),
              startTime: booking.startTime || '13:00',
              endTime: booking.endTime || '17:00',
            },
            '2': {
              name: t('reservation.time.period.evening'),
              startTime: booking.startTime || '18:00',
              endTime: booking.endTime || '22:00',
            },
          };

          if (!config[timeSlot]) return acc;

          if (!acc[timeSlot]) {
            acc[timeSlot] = {
              id: timeSlot,
              name: config[timeSlot].name,
              startTime: config[timeSlot].startTime,
              endTime: config[timeSlot].endTime,
              usageCount: 0,
            };
          }
          acc[timeSlot].usageCount += 1;
          return acc;
        }, {});

        const favoriteTimeSlots = Object.values(grouped).sort(
          (a: any, b: any) => b.usageCount - a.usageCount
        );

        this.setData({
          favoriteSeats,
          favoriteTimeSlots,
          totalCount: favoriteTimeSlots.length,
          favoriteSeatsCount: favoriteSeats.length,
        });
        wx.hideLoading();
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      });
  },

  onSeatCardTap(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/seat-detail/seat-detail?id=${id}`,
    });
  },

  onQuickReserveSeat(event: WechatMiniprogram.CustomEvent) {
    const dataset = event.currentTarget.dataset as any;
    const facilities = Array.isArray(dataset.facilities)
      ? dataset.facilities.join(',')
      : String(dataset.facilities || '');
    openReservationWithParams({
      seatId: dataset.id,
      seatName: dataset.seatName,
      zone: dataset.zone,
      floor: dataset.floor,
      type: dataset.type,
      facilities,
    });
  },

  onSelectSeat(event: WechatMiniprogram.CustomEvent) {
    this.onQuickReserveSeat(event);
  },

  onSelectTimeSlot(event: WechatMiniprogram.CustomEvent) {
    const dataset = event.currentTarget.dataset as any;
    openReservationWithParams({
      date: getToday(),
      timeSlotId: dataset.id,
      timeSlotName: dataset.name,
      startTime: dataset.startTime,
      endTime: dataset.endTime,
      usageCount: dataset.usageCount,
    });
  },

  onUnfavoriteSeat(event: WechatMiniprogram.CustomEvent) {
    const { id } = event.currentTarget.dataset as any;

    wx.showModal({
      title: t('myCollection.confirm.deleteSeatTitle'),
      content: t('myCollection.confirm.deleteSeatContent'),
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (!res.confirm) return;
        favoriteSeat(id)
          .then(() => {
            const nextSeats = this.data.favoriteSeats.filter((item) => item.id !== id);
            this.setData({
              favoriteSeats: nextSeats,
              favoriteSeatsCount: nextSeats.length,
            });
            wx.showToast({
              title: t('myCollection.hint.deleteSuccess'),
              icon: 'success',
            });
          })
          .catch(() => {
            wx.showToast({ title: t('common.hint.error'), icon: 'none' });
          });
      },
    });
  },

  stopPropagation() {},
});
