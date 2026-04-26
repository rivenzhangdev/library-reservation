import { t, getLangClassName } from '../../utils/i18n';
import { getFavorites, favoriteSeat } from '../../apis/user';
import { getMyBookings } from '../../apis/booking';
import { isLogin, redirectToLogin } from '../../utils/auth';
import { openReservationWithParams } from '../../utils/reservationNavigator';
import { sortBySeatPosition } from '../../utils/sort';
import { getToday } from '../../utils/time';
import { getFallbackTimeSlotConfigs } from '../../utils/time-slot';

function getStatusText(status: string) {
  const map: Record<string, string> = {
    available: t('common.status.available'),
    booked: t('common.status.booked'),
    maintenance: t('common.status.maintenance'),
  };
  return map[status] || t('common.status.available');
}

async function fetchAllMyBookings(pageSize = 20) {
  let page = 1;
  let hasMore = true;
  const result: any[] = [];

  while (hasMore) {
    // Use paged requests to avoid one large query and keep behavior consistent with other pages.
    const res: any = await getMyBookings({ page, pageSize });
    const list = Array.isArray(res?.data?.list) ? res.data.list : [];
    const total = Number(res?.data?.total || 0);

    result.push(...list);
    hasMore = result.length < total && list.length > 0;
    page += 1;
  }

  return result;
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
      navTitle: t('common.quick.myCollection'),
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

    Promise.all([getFavorites(), fetchAllMyBookings(20)])
      .then(([favoritesRes, bookingsRes]: any) => {
        const seats = Array.isArray(favoritesRes?.data?.list) ? favoritesRes.data.list : [];
        const bookings = Array.isArray(bookingsRes) ? bookingsRes : [];
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

        const fallbackTimeSlots = getFallbackTimeSlotConfigs();
        const fallbackTimeSlotMap = fallbackTimeSlots.reduce((acc: Record<string, any>, item) => {
          acc[String(item.slot)] = item;
          return acc;
        }, {});

        const grouped = bookings.reduce((acc: Record<string, any>, booking: any) => {
          const timeSlot = String(booking.timeSlot ?? '');
          const config = fallbackTimeSlotMap[timeSlot];
          if (!config) return acc;

          if (!acc[timeSlot]) {
            acc[timeSlot] = {
              id: timeSlot,
              name: config.label,
              startTime: booking.startTime || config.startTime,
              endTime: booking.endTime || config.endTime,
              usageCount: 0,
              sortOrder: config.sortOrder,
            };
          }
          acc[timeSlot].usageCount += 1;
          return acc;
        }, {});

        const favoriteTimeSlots = Object.values(grouped).sort((a: any, b: any) => {
          if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
          return Number(a.sortOrder) - Number(b.sortOrder);
        });

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
