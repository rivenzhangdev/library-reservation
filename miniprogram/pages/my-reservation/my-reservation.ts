import { getLangClassName, t } from '../../utils/i18n';
import { getMyBookings, cancelBooking, checkin, checkout, renewBooking } from '../../apis/booking';
import { isLogin } from '../../utils/auth';

Page({
  data: {
    searchValue: '',
    currentStatus: 'all',
    statusList: [] as Array<{ id: string; name: string; count: number }>,
    reservations: [] as any[],
    filteredReservations: [] as any[],
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    searchPlaceholder: '',
    searchingHint: '',
    emptyHint: '',
    confirmCheckinTitle: '',
    confirmCheckinContent: '',
    confirmRenewTitle: '',
    confirmRenewContent: '',
    confirmCancelTitle: '',
    confirmCancelContent: '',
    checkinSuccessHint: '',
    renewSuccessHint: '',
    cancelSuccessHint: '',
    actionCheckinText: '',
    actionCheckoutText: '',
    actionRenewText: '',
    actionCancelText: '',
    actionDetailText: '',
  },

  onLoad(options: Record<string, string>) {
    this.initLanguage();
    const quickAction = String(options?.quickAction || '');
    const currentStatus = quickAction === 'renew' ? 'ongoing' : 'all';
    this.setData({ quickAction, currentStatus }, () => {
      this.loadReservations();
    });
  },

  onShow() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    if (currentLang !== this.data.currentLang) {
      this.initLanguage();
    }
    this.loadReservations();
  },

  initLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';

    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('myReservation.title'),
      searchPlaceholder: t('myReservation.search.placeholder'),
      searchingHint: t('common.hint.loading'),
      emptyHint: t('myReservation.empty'),
      confirmCheckinTitle: t('myReservation.confirm.checkinTitle'),
      confirmCheckinContent: t('myReservation.confirm.checkinContent'),
      confirmCheckoutTitle: t('myReservation.confirm.checkoutTitle'),
      confirmCheckoutContent: t('myReservation.confirm.checkoutContent'),
      confirmRenewTitle: t('myReservation.confirm.renewTitle'),
      confirmRenewContent: t('myReservation.confirm.renewContent'),
      confirmCancelTitle: t('myReservation.confirm.cancelTitle'),
      confirmCancelContent: t('myReservation.confirm.cancelContent'),
      checkinSuccessHint: t('myReservation.hint.checkinSuccess'),
      renewSuccessHint: t('myReservation.hint.renewSuccess'),
      cancelSuccessHint: t('myReservation.hint.cancelSuccess'),
      actionCheckinText: t('myReservation.action.checkin'),
      actionCheckoutText: t('myReservation.action.checkout'),
      actionRenewText: t('myReservation.action.renew'),
      actionCancelText: t('common.btn.cancel'),
      actionDetailText: t('common.btn.detail'),
      statusList: [
        { id: 'all', name: t('common.status.all'), count: 0 },
        { id: 'ongoing', name: t('common.status.ongoing'), count: 0 },
        { id: 'upcoming', name: t('common.status.upcoming'), count: 0 },
        { id: 'completed', name: t('common.status.completed'), count: 0 },
        { id: 'cancelled', name: t('common.status.cancelled'), count: 0 },
        { id: 'violated', name: t('common.status.violated'), count: 0 },
      ],
    });
  },

  loadReservations() {
    if (!isLogin()) {
      wx.showToast({ title: t('common.hint.pleaseLogin'), icon: 'none' });
      return;
    }

    wx.showLoading({ title: this.data.searchingHint });

    getMyBookings({ page: 1, limit: 50 })
      .then((res: any) => {
        const responseData = res.data as any;
        const list = responseData?.bookings || [];
        const timeSlotNames: Record<number, string> = {
          0: t('reservation.time.period.morning'),
          1: t('reservation.time.period.afternoon'),
          2: t('reservation.time.period.evening'),
        };
        const statusNames: Record<number, string> = {
          0: 'upcoming',
          1: 'ongoing',
          2: 'completed',
          3: 'cancelled',
          4: 'violated',
        };

        const reservations = list.map((booking: any) => {
          const timeSlot = Number.isFinite(booking.timeSlot) ? Number(booking.timeSlot) : 0;
          return {
            id: String(booking.id),
            seatName:
              `${booking.floorName || ''} ${booking.zone || ''} R${booking.rowNum}C${booking.colNum}`.trim(),
            seatId: String(booking.seatId),
            zone: booking.zone || '',
            floor: booking.floorName || '',
            date: booking.date,
            startTime: booking.startTime || '',
            endTime: booking.endTime || '',
            timeSlot,
            timeSlotText: timeSlotNames[timeSlot] || '',
            status: statusNames[booking.status] || 'upcoming',
            type: timeSlotNames[booking.timeSlot] || '',
          };
        });

        this.updateStatusCounts(reservations);
        wx.hideLoading();
      })
      .catch((err) => {
        console.error('鍔犺浇棰勭害澶辫触:', err);
        wx.hideLoading();
      });
  },

  updateStatusCounts(reservations: any[]) {
    const counts = {
      all: reservations.length,
      ongoing: reservations.filter((item) => item.status === 'ongoing').length,
      upcoming: reservations.filter((item) => item.status === 'upcoming').length,
      completed: reservations.filter((item) => item.status === 'completed').length,
      cancelled: reservations.filter((item) => item.status === 'cancelled').length,
      violated: reservations.filter((item) => item.status === 'violated').length,
    };

    const statusList = this.data.statusList.map((item) => ({
      ...item,
      count: counts[item.id as keyof typeof counts],
    }));

    const processedReservations = reservations.map((item) => ({
      ...item,
      tagType: this.getTagTypeByStatus(item.status),
      statusName: this.getStatusNameByStatus(item.status),
    }));

    this.setData({
      statusList,
      reservations: processedReservations,
      filteredReservations: processedReservations,
    });
    this.filterReservations();
  },

  getTagTypeByStatus(status: string) {
    switch (status) {
      case 'ongoing':
        return 'success';
      case 'upcoming':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'default';
      case 'violated':
        return 'danger';
      default:
        return 'default';
    }
  },

  getTimeSlotText(timeSlot: number) {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    switch (timeSlot) {
      case 0:
        return t('reservation.time.period.morning');
      case 1:
        return t('reservation.time.period.afternoon');
      case 2:
        return t('reservation.time.period.evening');
      default:
        return t('reservation.time.period.unknown');
    }
  },

  getStatusNameByStatus(status: string) {
    return this.data.statusList.find((item) => item.id === status)?.name || '';
  },

  onSearchChange(e: any) {
    this.setData({ searchValue: e.detail });
    this.debounceSearch();
  },

  debounceSearch() {
    clearTimeout((this as any).searchTimer);
    (this as any).searchTimer = setTimeout(() => {
      this.filterReservations();
    }, 300);
  },

  onStatusTap(e: any) {
    this.setData({ currentStatus: e.currentTarget.dataset.id });
    this.filterReservations();
  },

  filterReservations() {
    const { searchValue, currentStatus, reservations } = this.data;
    let filtered = [...reservations];

    if (currentStatus !== 'all') {
      filtered = filtered.filter((item) => item.status === currentStatus);
    }

    if (searchValue) {
      filtered = filtered.filter(
        (item) =>
          item.seatName.includes(searchValue) ||
          item.zone.includes(searchValue) ||
          item.floor.includes(searchValue)
      );
    }

    this.setData({ filteredReservations: filtered });
  },

  onCheckinTap(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: this.data.confirmCheckinTitle,
      content: this.data.confirmCheckinContent,
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (!res.confirm) return;
        checkin(id)
          .then(() => {
            wx.showToast({ title: this.data.checkinSuccessHint, icon: 'success' });
            this.loadReservations();
          })
          .catch(() => {
            wx.showToast({ title: t('common.hint.error'), icon: 'none' });
          });
      },
    });
  },

  onCheckoutTap(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: this.data.confirmCheckoutTitle,
      content: this.data.confirmCheckoutContent,
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (!res.confirm) return;
        checkout(id)
          .then(() => {
            wx.showToast({ title: t('common.hint.checkOutSuccess'), icon: 'success' });
            this.loadReservations();
          })
          .catch(() => {
            wx.showToast({ title: t('common.hint.error'), icon: 'none' });
          });
      },
    });
  },

  onRenewTap(e: any) {
    const { id } = e.currentTarget.dataset;
    const reservation = this.data.reservations.find((item) => item.id === id);
    const currentTimeSlot = Number.isFinite(reservation?.timeSlot)
      ? Number(reservation?.timeSlot)
      : 0;

    if (currentTimeSlot >= 2) {
      wx.showToast({ title: t('myReservation.hint.renewFailed'), icon: 'none' });
      return;
    }

    const nextTimeSlot = currentTimeSlot + 1;
    const nextTimeSlotText = this.getTimeSlotText(nextTimeSlot);

    wx.showModal({
      title: this.data.confirmRenewTitle,
      content: `${this.data.confirmRenewContent}\n${t('reservation.time.period.selectRange')}: ${nextTimeSlotText}`,
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (!res.confirm) return;
        renewBooking(id, nextTimeSlot)
          .then(() => {
            wx.showToast({ title: this.data.renewSuccessHint, icon: 'success' });
            this.loadReservations();
          })
          .catch(() => {
            wx.showToast({ title: t('myReservation.hint.renewFailed'), icon: 'none' });
          });
      },
    });
  },

  onCancelTap(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: this.data.confirmCancelTitle,
      content: this.data.confirmCancelContent,
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (!res.confirm) return;
        cancelBooking(id)
          .then(() => {
            wx.showToast({ title: this.data.cancelSuccessHint, icon: 'success' });
            this.loadReservations();
          })
          .catch(() => {
            wx.showToast({ title: t('common.hint.error'), icon: 'none' });
          });
      },
    });
  },

  onDetailTap(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/booking-detail/booking-detail?id=${id}`,
    });
  },
});
