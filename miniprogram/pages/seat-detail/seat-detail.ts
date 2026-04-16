import { getSeatDetail } from '../../apis/seats';
import { getFavorites, favoriteSeat } from '../../apis/user';
import { isLogin } from '../../utils/auth';
import { t } from '../../utils/i18n';
import { openReservationWithParams } from '../../utils/reservationNavigator';
import { getToday } from '../../utils/time';

function getSeatTypeLabel(type: any) {
  const key = String(type);
  if (key === '1') return t('reservation.seatType.double');
  if (key === '2') return t('reservation.seatType.group');
  return t('reservation.seatType.single');
}

function resolveStatusMeta(status: any) {
  const key = String(status);
  if (key === '1' || key === 'booked') {
    return { type: 'warning', text: t('common.status.booked') };
  }
  if (key === '2' || key === 'maintenance') {
    return { type: 'default', text: t('common.status.maintenance') };
  }
  return { type: 'success', text: t('common.status.available') };
}

Page({
  data: {
    navTitle: '',
    seatId: '',
    currentDate: '',
    isFavorite: false,
    seat: null as any,
    timeSlots: [] as Array<{ key: string; label: string; type: string; text: string }>,
  },

  onLoad(options: Record<string, string>) {
    const seatId = options.id || options.seatId || '';
    this.setData({
      navTitle: t('common.btn.detail'),
      seatId,
      currentDate: getToday(),
    });
    if (seatId) {
      this.loadSeatDetail(seatId);
      this.loadFavoriteState(seatId);
    }
  },

  onShow() {
    this.setData({ navTitle: t('common.btn.detail') });
  },

  loadFavoriteState(seatId: string) {
    if (!isLogin()) return;
    getFavorites()
      .then((res: any) => {
        const list = Array.isArray(res.data) ? res.data : [];
        this.setData({
          isFavorite: list.some((item: any) => String(item.id) === String(seatId)),
        });
      })
      .catch(() => {});
  },

  loadSeatDetail(seatId: string) {
    getSeatDetail(seatId, { date: this.data.currentDate })
      .then((res: any) => {
        const detail = res.data || {};
        const facilities = [
          ...(detail.hasSocket ? [t('common.seat.facilities.power')] : []),
          ...(detail.isWindow ? [t('common.seat.facilities.window')] : []),
        ];
        const timeSlotStatus = detail.timeSlotStatus || {};
        const timeSlots = [
          { key: 'morning', label: t('reservation.time.period.morning') },
          { key: 'afternoon', label: t('reservation.time.period.afternoon') },
          { key: 'evening', label: t('reservation.time.period.evening') },
        ].map((slot) => {
          const statusMeta = resolveStatusMeta(timeSlotStatus[slot.key]);
          return {
            key: slot.key,
            label: slot.label,
            type: statusMeta.type,
            text: statusMeta.text,
          };
        });

        this.setData({
          navTitle: detail.description || t('common.btn.detail'),
          seat: {
            id: String(detail.id || seatId),
            name: `${detail.floorName || ''} ${detail.zone || ''} R${detail.row ?? '-'}C${detail.col ?? '-'}`.trim(),
            floorName: detail.floorName || '',
            zone: detail.zone || '',
            description: detail.description || t('common.empty.noDescription'),
            typeText: getSeatTypeLabel(detail.type),
            facilities,
          },
          timeSlots,
        });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      });
  },

  onToggleFavorite() {
    if (!isLogin()) {
      wx.showToast({ title: t('common.hint.pleaseLogin'), icon: 'none' });
      return;
    }
    favoriteSeat(this.data.seatId)
      .then(() => {
        const isFavorite = !this.data.isFavorite;
        this.setData({ isFavorite });
        wx.showToast({
          title: isFavorite ? t('common.btn.favorite') : t('common.btn.unfavorite'),
          icon: 'success',
        });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      });
  },

  onReserve() {
    const seat = this.data.seat;
    if (!seat) return;
    openReservationWithParams({
      seatId: this.data.seatId,
      seatName: seat.name,
      zone: seat.zone,
      floor: seat.floorName,
      type: seat.typeText,
      facilities: (seat.facilities || []).join(','),
      date: this.data.currentDate,
    });
  },
});
