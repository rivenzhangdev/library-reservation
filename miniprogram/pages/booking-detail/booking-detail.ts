import {
  cancelBooking,
  checkin,
  checkout,
  getBookingDetail,
  renewBooking,
} from '../../apis/booking';
import { t } from '../../utils/i18n';

function getStatusMeta(status: any) {
  const statusMap: Record<string, { type: string; text: string }> = {
    '0': { type: 'warning', text: t('common.status.upcoming') },
    '1': { type: 'success', text: t('common.status.ongoing') },
    '2': { type: 'primary', text: t('common.status.completed') },
    '3': { type: 'default', text: t('common.status.cancelled') },
    '4': { type: 'danger', text: t('common.status.violated') },
  };
  return statusMap[String(status)] || { type: 'default', text: t('common.field.status') };
}

function getTimeSlotLabel(timeSlot: any) {
  const map: Record<string, string> = {
    '0': t('reservation.time.period.morning'),
    '1': t('reservation.time.period.afternoon'),
    '2': t('reservation.time.period.evening'),
  };
  return map[String(timeSlot)] || '-';
}

Page({
  data: {
    navTitle: '',
    bookingId: '',
    booking: null as any,
  },

  onLoad(options: Record<string, string>) {
    const bookingId = options.id || '';
    this.setData({
      navTitle: t('myReservation.detail.title'),
      bookingId,
    });
    if (bookingId) {
      this.loadDetail(bookingId);
    }
  },

  onShow() {
    this.setData({ navTitle: t('myReservation.detail.title') });
  },

  loadDetail(bookingId: string) {
    getBookingDetail(bookingId)
      .then((res: any) => {
        const detail = res.data || {};
        const statusMeta = getStatusMeta(detail.status);
        const facilities = [
          ...(detail.hasSocket ? [t('common.seat.facilities.power')] : []),
          ...(detail.isWindow ? [t('common.seat.facilities.window')] : []),
        ];
        this.setData({
          booking: {
            ...detail,
            seatName:
              `${detail.floorName || ''} ${detail.zone || ''} R${detail.rowNum ?? '-'}C${detail.colNum ?? '-'}`.trim(),
            statusText: statusMeta.text,
            statusType: statusMeta.type,
            timeSlotText: getTimeSlotLabel(detail.timeSlot),
            facilities,
            canCheckin: String(detail.status) === '0',
            canCheckout: String(detail.status) === '1',
            canRenew: String(detail.status) === '1',
            canCancel: String(detail.status) === '0' || String(detail.status) === '1',
          },
        });
      })
      .catch(() => {
        wx.showToast({ title: t('myReservation.hint.loadFailed'), icon: 'none' });
      });
  },

  onCheckin() {
    checkin(this.data.bookingId)
      .then(() => {
        wx.showToast({ title: t('myReservation.hint.checkinSuccess'), icon: 'success' });
        this.loadDetail(this.data.bookingId);
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      });
  },

  onRenew() {
    const booking = this.data.booking;
    const nextTimeSlot = booking?.timeSlot === 2 ? 0 : Number(booking?.timeSlot || 0) + 1;
    renewBooking(this.data.bookingId, String(nextTimeSlot))
      .then(() => {
        wx.showToast({ title: t('myReservation.hint.renewSuccess'), icon: 'success' });
        this.loadDetail(this.data.bookingId);
      })
      .catch(() => {
        wx.showToast({ title: t('myReservation.hint.renewFailed'), icon: 'none' });
      });
  },

  onCheckout() {
    checkout(this.data.bookingId)
      .then(() => {
        wx.showToast({ title: t('common.hint.checkOutSuccess'), icon: 'success' });
        this.loadDetail(this.data.bookingId);
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      });
  },

  onCancel() {
    wx.showModal({
      title: t('myReservation.confirm.cancelTitle'),
      content: t('myReservation.confirm.cancelContent'),
      success: (modal) => {
        if (!modal.confirm) return;
        cancelBooking(this.data.bookingId)
          .then(() => {
            wx.showToast({ title: t('myReservation.hint.cancelSuccess'), icon: 'success' });
            this.loadDetail(this.data.bookingId);
          })
          .catch(() => {
            wx.showToast({ title: t('common.hint.error'), icon: 'none' });
          });
      },
    });
  },
});
