import { getLangClassName, t } from '../../utils/i18n';
import { getMyBookings, cancelBooking, checkin, checkout, renewBooking } from '../../apis/booking';
import { createChangeRequest } from '../../apis/changeRequest';
import { getTimeSlotConfigs } from '../../apis/config';
import { searchSeats } from '../../apis/seats';
import { isLogin } from '../../utils/auth';
import {
  buildTimeSlotConfigs,
  buildTimeSlotNameMap,
  getFallbackTimeSlotConfigs,
} from '../../utils/time-slot';

function getStatusName(status: string, statusList: Array<{ id: string; name: string }>) {
  return statusList.find((item) => item.id === status)?.name || '';
}

function getTagTypeByStatus(status: string) {
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
}

function buildSeatTitle(booking: any) {
  if (booking.seatName) return booking.seatName;
  const zone = booking.zone ? `${booking.zone}` : '';
  const floor = booking.floorName ? `${booking.floorName}` : '';
  const row = booking.rowNum ? `R${booking.rowNum}` : '';
  const col = booking.colNum ? `C${booking.colNum}` : '';
  return [zone, floor, row + col].filter(Boolean).join(' ') || String(booking.seatId || '');
}

function buildSeatCandidateLabel(seat: any) {
  const floor = String(seat?.floorName || '').trim();
  const zone = String(seat?.zone || '').trim();
  const row = Number(seat?.row ?? seat?.rowNum ?? 0);
  const col = Number(seat?.col ?? seat?.colNum ?? 0);
  const position = row > 0 && col > 0 ? `R${row}C${col}` : '';
  const description = String(seat?.description || '').trim();
  return [floor, zone, position, description].filter(Boolean).join(' ');
}

function getChangeRequestErrorHint(code: string) {
  switch (code) {
    case '5001':
      return t('myReservation.changeRequest.hint.renewConflict');
    case '5203':
      return t('myReservation.changeRequest.hint.duplicate');
    case '5204':
      return t('myReservation.changeRequest.hint.targetUnavailable');
    case '5205':
      return t('myReservation.changeRequest.hint.limitExceeded');
    case '5206':
      return t('myReservation.changeRequest.hint.invalidTarget');
    case '5005':
      return t('myReservation.changeRequest.hint.bookingNotFound');
    case '1005':
      return t('myReservation.changeRequest.hint.adminRequired');
    default:
      return t('myReservation.changeRequest.hint.submitFailed');
  }
}

function buildRenewableGuideText(
  bookingStatus: string,
  renewableTimeSlots: number[],
  slotNameMap: Record<number, string>,
  renewalAdvanceDays: number
) {
  if (bookingStatus !== 'upcoming') return '';
  if (!Array.isArray(renewableTimeSlots) || renewableTimeSlots.length === 0) return '';

  const enabledText = renewableTimeSlots
    .map((slot) => slotNameMap[slot] || String(slot))
    .join(' / ');
  if (renewalAdvanceDays > 0) {
    return t('myReservation.hint.renewGuide.advanceDays', {
      slots: enabledText,
      days: renewalAdvanceDays,
    });
  }
  return t('myReservation.hint.renewGuide.sameDay', { slots: enabledText });
}

function getRenewBlockedHint(reason: string, renewalAdvanceDays = 0) {
  switch (reason) {
    case 'advance_window_not_reached':
      return renewalAdvanceDays > 0
        ? t('myReservation.hint.renewWindow.advanceDays', { days: renewalAdvanceDays })
        : t('myReservation.hint.renewWindow.sameDay');
    case 'today_only':
      return t('myReservation.hint.renewWindow.sameDay');
    case 'no_later_time_slot':
      return t('myReservation.hint.renewBlocked.noLaterTimeSlot');
    case 'renewal_limit_reached':
      return t('myReservation.hint.renewBlocked.limitReached');
    case 'slots_unavailable_or_conflict':
      return t('myReservation.hint.renewBlocked.slotUnavailableOrConflict');
    default:
      return t('myReservation.hint.renewNoSlotReason');
  }
}

function resolveRenewBlockedReason(params: {
  bookingStatus: string;
  renewableTimeSlots: number[];
  renewBlockedReason: string;
}) {
  const { bookingStatus, renewableTimeSlots, renewBlockedReason } = params;
  if (bookingStatus !== 'upcoming') return '';

  if (renewBlockedReason) {
    return renewBlockedReason;
  }

  if (!Array.isArray(renewableTimeSlots) || renewableTimeSlots.length === 0) {
    return 'slots_unavailable_or_conflict';
  }

  return '';
}

function formatDateOnly(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function getTodayText() {
  return formatDateOnly(new Date());
}

function buildRescheduleDateCandidates(maxAdvanceDays = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.floor(Number(maxAdvanceDays) || 0));
  const candidates: Array<{ date: string; label: string }> = [];
  for (let offset = 0; offset < totalDays; offset += 1) {
    const targetDate = addDays(today, offset);
    const dateText = formatDateOnly(targetDate);
    const dayTag =
      offset === 0
        ? t('myReservation.changeRequest.date.today')
        : offset === 1
          ? t('myReservation.changeRequest.date.tomorrow')
          : '';
    const label = dayTag ? `${dateText} (${dayTag})` : dateText;
    candidates.push({ date: dateText, label });
  }
  return candidates;
}

function getPastTimeSlotsForToday() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const ranges = [12 * 60, 17 * 60, 22 * 60];
  return [0, 1, 2].filter((slot) => ranges[slot] <= minutes);
}

function showSimpleModal(content: string, title = t('common.hint.error')) {
  wx.showModal({
    title,
    content,
    showCancel: false,
    confirmText: t('common.btn.confirm'),
  });
}

Page({
  data: {
    searchValue: '',
    currentStatus: 'all',
    page: 1,
    pageSize: 20,
    hasMore: true,
    loadingMore: false,
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
    confirmCheckoutTitle: '',
    confirmCheckoutContent: '',
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
    actionChangeRequestText: '',
    actionCancelText: '',
    actionDetailText: '',
    loadingMoreHint: '',
    noMoreHint: '',
    changeRequestPanelVisible: false,
    changeRequestPanelStep: 'type' as 'type' | 'reschedule' | 'seat_change',
    changeRequestPanelTitle: '',
    changeRequestPanelSubtitle: '',
    changeRequestBookingId: '',
    changeRequestSelectedType: '' as '' | 'reschedule' | 'seat_change',
    changeRequestDateCandidates: [] as Array<{ date: string; label: string }>,
    changeRequestSelectedDate: '',
    changeRequestTimeSlotConfigs: [] as Array<{ slot: number; label: string }>,
    changeRequestSlotCandidates: [] as Array<{ slot: number; label: string }>,
    changeRequestSelectedSlot: -1,
    changeRequestSeatKeyword: '',
    changeRequestSeatCandidates: [] as Array<{ id: number; label: string }>,
    changeRequestSelectedSeatId: -1,
    changeRequestSeatLoading: false,
    changeRequestSubmitting: false,
    changeRequestRescheduleOptionText: '',
    changeRequestRescheduleOptionDescText: '',
    changeRequestSeatChangeOptionText: '',
    changeRequestSeatChangeOptionDescText: '',
    changeRequestPanelHintText: '',
    changeRequestBackText: '',
    changeRequestDateLabelText: '',
    changeRequestSlotLabelText: '',
    changeRequestSearchText: '',
    changeRequestNoSeatCandidateText: '',
    changeRequestSeatKeywordPlaceholder: '',
    changeRequestReasonInput: '',
    changeRequestReasonLabelText: '',
    changeRequestReasonPlaceholder: '',
    commonConfirmText: '',
    commonCancelText: '',
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

  onUnload() {
    // noop
  },

  onPullDownRefresh() {
    this.loadReservations(true);
  },

  onReachBottom() {
    this.loadReservations(false);
  },

  initLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    const isZh = currentLang === 'zh';

    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('common.quick.myReservation'),
      searchPlaceholder: t('myReservation.search.placeholder'),
      searchingHint: t('common.hint.loading'),
      emptyHint: t('common.empty.reservation'),
      confirmCheckinTitle: t('myReservation.confirm.checkinTitle'),
      confirmCheckinContent: t('myReservation.confirm.checkinContent'),
      confirmCheckoutTitle: t('myReservation.confirm.checkoutTitle'),
      confirmCheckoutContent: t('myReservation.confirm.checkoutContent'),
      confirmRenewTitle: t('myReservation.confirm.renewTitle'),
      confirmRenewContent: t('myReservation.confirm.renewContent'),
      confirmCancelTitle: t('myReservation.confirm.cancelTitle'),
      confirmCancelContent: t('myReservation.confirm.cancelContent'),
      checkinSuccessHint: t('common.hint.checkInSuccess'),
      renewSuccessHint: t('myReservation.hint.renewSuccess'),
      cancelSuccessHint: t('common.toast.cancelSuccess'),
      actionCheckinText: t('myReservation.action.checkin'),
      actionCheckoutText: t('myReservation.action.checkout'),
      violatedPenaltyHint: t('myReservation.hint.violatedPenalty'),
      actionRenewText: t('myReservation.action.renew'),
      actionChangeRequestText: t('myReservation.action.changeRequest'),
      actionCancelText: t('common.btn.cancel'),
      actionDetailText: t('common.btn.detail'),
      loadingMoreHint: t('common.hint.loading'),
      noMoreHint: t('common.hint.noMore'),
      changeRequestPanelTitle: t('myReservation.action.changeRequest'),
      changeRequestRescheduleOptionText: t('myReservation.changeRequest.options.reschedule'),
      changeRequestRescheduleOptionDescText: isZh
        ? '保留原座位，选择新的日期和时段提交审批'
        : 'Keep your seat and request a new date/time slot.',
      changeRequestSeatChangeOptionText: t('myReservation.changeRequest.options.seatChange'),
      changeRequestSeatChangeOptionDescText: isZh
        ? '保留原日期和时段，选择目标座位提交审批'
        : 'Keep date/time and request another seat.',
      changeRequestPanelHintText: isZh
        ? '提交后将进入审批流程，审批通过后自动生效。'
        : 'Your request will take effect after approval.',
      changeRequestBackText: isZh ? '返回上一步' : 'Back',
      changeRequestDateLabelText: isZh ? '选择日期' : 'Select date',
      changeRequestSlotLabelText: isZh ? '选择时段' : 'Select time slot',
      changeRequestSearchText: t('common.btn.search'),
      changeRequestNoSeatCandidateText: t('myReservation.changeRequest.hint.noSeatCandidate'),
      changeRequestSeatKeywordPlaceholder: t(
        'myReservation.changeRequest.hint.seatKeywordPlaceholder'
      ),
      changeRequestReasonLabelText: t('myReservation.changeRequest.reason.title'),
      changeRequestReasonPlaceholder: t('myReservation.changeRequest.reason.placeholder'),
      commonConfirmText: t('common.btn.confirm'),
      commonCancelText: t('common.btn.cancel'),
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

  loadReservations(reset = true) {
    if (!isLogin()) {
      this.setData({
        loadingMore: false,
        hasMore: false,
        reservationList: [],
      });
      return;
    }

    if (!reset) {
      if (this.data.loadingMore || !this.data.hasMore) {
        return;
      }
      this.setData({ loadingMore: true });
    }

    const targetPage = reset ? 1 : this.data.page + 1;
    if (reset) {
      wx.showLoading({ title: this.data.searchingHint });
    }

    Promise.all([
      getMyBookings({ page: targetPage, pageSize: this.data.pageSize }),
      this.ensureChangeRequestTimeSlotConfigs(),
    ])
      .then(([res, slotConfigs]: [any, Array<{ slot: number; label: string }>]) => {
        const responseData = res.data as any;
        const list = Array.isArray(responseData?.list) ? responseData.list : [];
        const total = Number(responseData?.total || 0);
        const timeSlotNames = buildTimeSlotNameMap(slotConfigs);
        const statusNames: Record<number, string> = {
          0: 'upcoming',
          1: 'ongoing',
          2: 'completed',
          3: 'cancelled',
          4: 'violated',
        };

        const reservations = list.map((booking: any) => {
          const bookingStatus =
            typeof booking.status === 'number'
              ? statusNames[booking.status]
              : String(booking.status || 'upcoming');
          const bookingDate = String(booking.date || booking.createdAt || '').slice(0, 10);
          const timeSlot = Number.isFinite(booking.timeSlot) ? Number(booking.timeSlot) : -1;
          const renewableTimeSlots = Array.isArray(booking.renewableTimeSlots)
            ? booking.renewableTimeSlots.filter((slot: any) => Number.isFinite(slot)).map(Number)
            : [];
          const renewalAdvanceDays = Math.max(
            0,
            Math.floor(Number(booking.renewalAdvanceDays) || 0)
          );
          const renewBlockedReason = resolveRenewBlockedReason({
            bookingStatus,
            renewableTimeSlots,
            renewBlockedReason: String(booking.renewalBlockedReason || ''),
          });
          const canRenew =
            bookingStatus === 'upcoming' && !renewBlockedReason && renewableTimeSlots.length > 0;
          const renewHintText =
            bookingStatus === 'upcoming' && !canRenew
              ? getRenewBlockedHint(renewBlockedReason, renewalAdvanceDays)
              : '';
          const renewGuideText = canRenew
            ? buildRenewableGuideText(
                bookingStatus,
                renewableTimeSlots,
                timeSlotNames,
                renewalAdvanceDays
              )
            : '';
          const warningText =
            bookingStatus === 'violated' ? t('myReservation.hint.violatedPenalty') : '';
          const normalizeTime = (value: string) => {
            if (!value) return '';
            return value.length >= 5 ? value.slice(0, 5) : value;
          };
          const timeRange =
            booking.startTime && booking.endTime
              ? `${normalizeTime(booking.startTime)} - ${normalizeTime(booking.endTime)}`
              : timeSlotNames[timeSlot] || '';
          const seatName = buildSeatTitle(booking);

          return {
            id: String(booking.id),
            seatName,
            description: booking.description || booking.seatDescription || '',
            date: bookingDate,
            timeRange,
            region: booking.zone || booking.area || '',
            seatType:
              booking.seatTypeName || booking.typeName || booking.seatType || booking.type || '',
            status: bookingStatus,
            tagType: getTagTypeByStatus(bookingStatus),
            statusName: getStatusName(bookingStatus, this.data.statusList),
            timeSlot,
            renewableTimeSlots,
            canRenew,
            renewalAdvanceDays,
            renewBlockedReason,
            renewHintText,
            renewGuideText,
            booking,
            warningText,
          };
        });

        const merged = reset ? reservations : [...this.data.reservations, ...reservations];
        const uniqueMerged = Array.from(
          new Map(merged.map((item) => [String(item.id), item])).values()
        );
        const hasMore = uniqueMerged.length < total && reservations.length > 0;

        this.setData({
          page: targetPage,
          hasMore,
          loadingMore: false,
        });

        this.updateStatusCounts(uniqueMerged);
        if (reset) {
          wx.hideLoading();
        }
        wx.stopPullDownRefresh();
      })
      .catch((err) => {
        console.error('加载预约失败:', err);
        this.setData({ loadingMore: false });
        if (reset) {
          wx.hideLoading();
        }
        wx.stopPullDownRefresh();
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
      statusName: getStatusName(item.status, statusList),
    }));

    this.setData({
      statusList,
      reservations: processedReservations,
      filteredReservations: processedReservations,
    });
    this.filterReservations();
  },

  onSearchChange(e: any) {
    const value = typeof e.detail === 'string' ? e.detail : e.detail?.value || '';
    this.setData({ searchValue: value });
    this.debounceSearch();
  },

  debounceSearch() {
    clearTimeout((this as any).searchTimer);
    (this as any).searchTimer = setTimeout(() => {
      this.filterReservations();
    }, 300);
  },

  onStatusChange(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
    this.setData({ currentStatus: String(e?.detail?.id || 'all') });
    this.filterReservations();
  },

  filterReservations() {
    const { searchValue, currentStatus, reservations } = this.data;
    let filtered = [...reservations];

    if (currentStatus !== 'all') {
      filtered = filtered.filter((item) => item.status === currentStatus);
    }

    if (searchValue) {
      const keyword = String(searchValue).trim().toLowerCase();
      filtered = filtered.filter((item) =>
        [item.seatName, item.locationLabel, item.date, item.timeRange, item.statusName]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
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
        // 尝试获取位置后再签到（失败不阻塞签到流程）
        wx.getLocation({
          type: 'gcj02',
          success: (locRes) => {
            checkin(id, { latitude: locRes.latitude, longitude: locRes.longitude })
              .then(() => {
                wx.showToast({ title: this.data.checkinSuccessHint, icon: 'success' });
                this.loadReservations();
              })
              .catch(() => {
                wx.showToast({ title: t('common.hint.error'), icon: 'none' });
              });
          },
          fail: () => {
            // 位置权限未授权或不可用，降级为不带位置的签到
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

  async onRenewTap(e: any) {
    const { id } = e.currentTarget.dataset;
    const reservation = this.data.reservations.find((item) => item.id === id);
    if (!reservation) {
      wx.showToast({ title: t('myReservation.hint.loadFailed'), icon: 'none' });
      return;
    }

    if (!reservation.canRenew) {
      wx.showToast({
        title:
          reservation.renewHintText ||
          getRenewBlockedHint(reservation.renewBlockedReason, reservation.renewalAdvanceDays),
        icon: 'none',
      });
      return;
    }

    const renewableTimeSlots: number[] = Array.isArray(reservation?.renewableTimeSlots)
      ? reservation.renewableTimeSlots
      : [];

    if (renewableTimeSlots.length === 0) {
      wx.showToast({
        title: reservation.renewHintText || t('myReservation.hint.renewNoSlot'),
        icon: 'none',
      });
      return;
    }

    const slotConfigs = await this.ensureChangeRequestTimeSlotConfigs();
    const slotNames = buildTimeSlotNameMap(slotConfigs);
    const timeSlotTexts: string[] = renewableTimeSlots.map((slot) => slotNames[slot] || `${slot}`);
    const timeSlotValues = renewableTimeSlots;

    if (timeSlotValues.length === 1) {
      // 只有一个可选时段，直接确认
      const nextTimeSlot = timeSlotValues[0];
      const nextTimeSlotText = timeSlotTexts[0];
      wx.showModal({
        title: this.data.confirmRenewTitle,
        content: `${this.data.confirmRenewContent}\n${t('myReservation.renew.targetSlot', { slot: nextTimeSlotText })}`,
        confirmText: t('common.btn.confirm'),
        cancelText: t('common.btn.cancel'),
        success: (res) => {
          if (!res.confirm) return;
          renewBooking(id, nextTimeSlot)
            .then(() => {
              wx.showToast({ title: this.data.renewSuccessHint, icon: 'success' });
              this.loadReservations();
            })
            .catch((error: any) => {
              const code = String(error?.code || '');
              const backendMessage = String(
                error?.message || error?.data?.error?.message || ''
              ).toLowerCase();
              if (code === '5001') {
                wx.showToast({ title: t('myReservation.hint.renewFailedConflict'), icon: 'none' });
                return;
              }
              if (backendMessage.includes('current day')) {
                wx.showToast({ title: t('myReservation.hint.renewTodayOnly'), icon: 'none' });
                return;
              }
              wx.showToast({ title: t('myReservation.hint.renewFailed'), icon: 'none' });
            });
        },
      });
    } else {
      // 多个可选时段，让用户选择
      wx.showActionSheet({
        itemList: timeSlotTexts,
        success: (sheetRes) => {
          const selectedIndex = sheetRes.tapIndex;
          const selectedSlot = timeSlotValues[selectedIndex];
          const selectedSlotText = timeSlotTexts[selectedIndex];
          wx.showModal({
            title: this.data.confirmRenewTitle,
            content: `${this.data.confirmRenewContent}\n${t('myReservation.renew.targetSlot', { slot: selectedSlotText })}`,
            confirmText: t('common.btn.confirm'),
            cancelText: t('common.btn.cancel'),
            success: (res) => {
              if (!res.confirm) return;
              renewBooking(id, selectedSlot)
                .then(() => {
                  wx.showToast({ title: this.data.renewSuccessHint, icon: 'success' });
                  this.loadReservations();
                })
                .catch((error: any) => {
                  const code = String(error?.code || '');
                  const backendMessage = String(
                    error?.message || error?.data?.error?.message || ''
                  ).toLowerCase();
                  if (code === '5001') {
                    wx.showToast({
                      title: t('myReservation.hint.renewFailedConflict'),
                      icon: 'none',
                    });
                    return;
                  }
                  if (backendMessage.includes('current day')) {
                    wx.showToast({ title: t('myReservation.hint.renewTodayOnly'), icon: 'none' });
                    return;
                  }
                  if (code === '5301') {
                    wx.showToast({
                      title: t('myReservation.hint.renewLimitExceeded'),
                      icon: 'none',
                    });
                    return;
                  }
                  if (code === '5302') {
                    wx.showToast({
                      title: t('myReservation.hint.renewSlotUnavailable'),
                      icon: 'none',
                    });
                    return;
                  }
                  wx.showToast({ title: t('myReservation.hint.renewFailed'), icon: 'none' });
                });
            },
          });
        },
      });
    }
  },

  submitChangeRequest(payload: {
    bookingId: number;
    changeType: 'reschedule' | 'seat_change';
    targetDate?: string;
    targetTimeSlot?: number;
    targetSeatId?: number;
    reason: string;
  }) {
    return createChangeRequest(payload as any)
      .then(() => {
        wx.showModal({
          title: t('common.hint.success'),
          content: t('myReservation.changeRequest.hint.submitSuccess'),
          showCancel: false,
          confirmText: t('common.btn.confirm'),
          success: () => {
            this.onChangeRequestPanelClose();
            this.loadReservations();
          },
        });
      })
      .catch((error: any) => {
        const code = String(error?.code || '');
        const backendMessage = String(error?.message || error?.data?.error?.message || '').trim();
        if (backendMessage.toLowerCase().includes('same as current time slot')) {
          showSimpleModal(t('myReservation.changeRequest.hint.sameTimeSlot'));
          return;
        }
        if (code === '5203') {
          const existingId = String(error?.data?.existingRequest?.id || '');
          if (existingId) {
            wx.showModal({
              title: t('myReservation.changeRequest.hint.duplicate'),
              content: t('myReservation.changeRequest.hint.duplicateWithId', { id: existingId }),
              showCancel: false,
              confirmText: t('common.btn.confirm'),
            });
            return;
          }
          showSimpleModal(t('myReservation.changeRequest.hint.duplicate'));
          return;
        }

        const hint = getChangeRequestErrorHint(code);
        const detail =
          backendMessage &&
          backendMessage !== hint &&
          !backendMessage.toLowerCase().includes('target time slot')
            ? backendMessage
            : '';
        showSimpleModal(detail || hint);
      });
  },

  onChangeRequestReasonInput(e: any) {
    const value =
      typeof e?.detail === 'string'
        ? e.detail
        : typeof e?.detail?.value === 'string'
          ? e.detail.value
          : '';
    this.setData({ changeRequestReasonInput: value });
  },

  onChangeRequestTap(e: any) {
    const { id } = e.currentTarget.dataset;
    const reservation = this.data.reservations.find((item) => item.id === id);
    if (!reservation) {
      showSimpleModal(t('myReservation.hint.loadFailed'));
      return;
    }

    const bookingId = Number(reservation.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      showSimpleModal(t('myReservation.hint.loadFailed'));
      return;
    }
    const panelSubtitle = [reservation.seatName, reservation.date, reservation.timeRange]
      .filter(Boolean)
      .join(' · ');

    this.setData({
      changeRequestPanelVisible: true,
      changeRequestPanelStep: 'type',
      changeRequestPanelSubtitle: panelSubtitle,
      changeRequestBookingId: String(bookingId),
      changeRequestSelectedType: '',
      changeRequestDateCandidates: [],
      changeRequestSelectedDate: '',
      changeRequestSlotCandidates: [],
      changeRequestSelectedSlot: -1,
      changeRequestSeatKeyword: '',
      changeRequestSeatCandidates: [],
      changeRequestSelectedSeatId: -1,
      changeRequestSeatLoading: false,
      changeRequestSubmitting: false,
      changeRequestReasonInput: '',
    });
  },

  getChangeRequestReservation() {
    const bookingId = String(this.data.changeRequestBookingId || '');
    return this.data.reservations.find((item) => String(item.id) === bookingId) || null;
  },

  onChangeRequestPanelClose() {
    this.setData({
      changeRequestPanelVisible: false,
      changeRequestPanelStep: 'type',
      changeRequestSelectedType: '',
      changeRequestDateCandidates: [],
      changeRequestSelectedDate: '',
      changeRequestSlotCandidates: [],
      changeRequestSelectedSlot: -1,
      changeRequestSeatKeyword: '',
      changeRequestSeatCandidates: [],
      changeRequestSelectedSeatId: -1,
      changeRequestSeatLoading: false,
      changeRequestSubmitting: false,
      changeRequestReasonInput: '',
    });
  },

  onSelectChangeRequestType(e: any) {
    const changeType = String(e.currentTarget?.dataset?.type || '') as 'reschedule' | 'seat_change';
    if (changeType === 'reschedule') {
      this.prepareRescheduleStep();
      return;
    }
    if (changeType === 'seat_change') {
      this.prepareSeatChangeStep();
    }
  },

  onChangeRequestBack() {
    if (this.data.changeRequestSubmitting) return;
    this.setData({
      changeRequestPanelStep: 'type',
      changeRequestSelectedType: '',
      changeRequestSelectedDate: '',
      changeRequestSelectedSlot: -1,
      changeRequestSelectedSeatId: -1,
    });
  },

  async ensureChangeRequestTimeSlotConfigs() {
    const cached = Array.isArray(this.data.changeRequestTimeSlotConfigs)
      ? this.data.changeRequestTimeSlotConfigs
      : [];
    if (cached.length > 0) return cached;

    try {
      const res: any = await getTimeSlotConfigs();
      const list = Array.isArray(res?.data) ? res.data : [];
      const configs = buildTimeSlotConfigs(list);

      if (configs.length > 0) {
        this.setData({ changeRequestTimeSlotConfigs: configs });
        return configs;
      }
    } catch (error) {
      console.warn('加载变更申请时段配置失败，使用默认时段', error);
    }

    const fallback = getFallbackTimeSlotConfigs();
    this.setData({ changeRequestTimeSlotConfigs: fallback });
    return fallback;
  },

  async prepareRescheduleStep() {
    const reservation = this.getChangeRequestReservation();
    if (!reservation) {
      showSimpleModal(t('myReservation.hint.loadFailed'));
      return;
    }

    const slotConfigs = await this.ensureChangeRequestTimeSlotConfigs();
    const slotNameMap = buildTimeSlotNameMap(slotConfigs);
    const allSlots = Array.from(new Set(slotConfigs.map((item) => item.slot)));
    const currentSlot = Number(reservation.timeSlot);
    const renewableTimeSlots: number[] = Array.isArray(reservation.renewableTimeSlots)
      ? reservation.renewableTimeSlots.filter((slot: any) => Number.isFinite(slot)).map(Number)
      : [];

    const dateCandidates = buildRescheduleDateCandidates(7);
    const defaultDate = dateCandidates[0]?.date || '';
    const bookingDateText = String(reservation.date || '').slice(0, 10);
    const isSameDay = defaultDate === bookingDateText;
    const pastSlots = defaultDate === getTodayText() ? getPastTimeSlotsForToday() : [];
    const slotCandidates = allSlots
      .filter((slot) => {
        if (pastSlots.includes(slot)) return false;
        if (isSameDay && slot === currentSlot) return false;
        if (isSameDay && renewableTimeSlots.includes(slot)) return false;
        return true;
      })
      .map((slot) => ({ slot, label: slotNameMap[slot] || String(slot) }));

    this.setData({
      changeRequestSelectedType: 'reschedule',
      changeRequestPanelStep: 'reschedule',
      changeRequestDateCandidates: dateCandidates,
      changeRequestSelectedDate: defaultDate,
      changeRequestSlotCandidates: slotCandidates,
      changeRequestSelectedSlot: slotCandidates[0]?.slot ?? -1,
    });
  },

  async onSelectRescheduleDate(e: any) {
    const date = String(e.currentTarget?.dataset?.date || '');
    if (!date) return;

    const reservation = this.getChangeRequestReservation();
    if (!reservation) return;

    const slotConfigs = await this.ensureChangeRequestTimeSlotConfigs();
    const slotNameMap = buildTimeSlotNameMap(slotConfigs);
    const allSlots = Array.from(new Set(slotConfigs.map((item) => item.slot)));
    const currentSlot = Number(reservation.timeSlot);
    const renewableTimeSlots: number[] = Array.isArray(reservation.renewableTimeSlots)
      ? reservation.renewableTimeSlots.filter((slot: any) => Number.isFinite(slot)).map(Number)
      : [];
    const bookingDateText = String(reservation.date || '').slice(0, 10);
    const isSameDay = date === bookingDateText;
    const pastSlots = date === getTodayText() ? getPastTimeSlotsForToday() : [];

    const slotCandidates = allSlots
      .filter((slot) => {
        if (pastSlots.includes(slot)) return false;
        if (isSameDay && slot === currentSlot) return false;
        if (isSameDay && renewableTimeSlots.includes(slot)) return false;
        return true;
      })
      .map((slot) => ({ slot, label: slotNameMap[slot] || String(slot) }));

    this.setData({
      changeRequestSelectedDate: date,
      changeRequestSlotCandidates: slotCandidates,
      changeRequestSelectedSlot: slotCandidates[0]?.slot ?? -1,
    });
  },

  onSelectRescheduleSlot(e: any) {
    const slot = Number(e.currentTarget?.dataset?.slot);
    if (!Number.isInteger(slot)) return;
    this.setData({ changeRequestSelectedSlot: slot });
  },

  onConfirmRescheduleChange() {
    const bookingId = Number(this.data.changeRequestBookingId);
    const targetDate = String(this.data.changeRequestSelectedDate || '');
    const targetSlot = Number(this.data.changeRequestSelectedSlot);
    const reason = String(this.data.changeRequestReasonInput || '').trim();

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0 ||
      !targetDate ||
      !Number.isInteger(targetSlot)
    ) {
      showSimpleModal(t('myReservation.changeRequest.hint.noRescheduleSlot'));
      return;
    }
    if (!reason) {
      showSimpleModal(t('myReservation.changeRequest.reason.required'));
      return;
    }

    this.setData({ changeRequestSubmitting: true }, () => {
      this.submitChangeRequest({
        bookingId,
        changeType: 'reschedule',
        targetDate,
        targetTimeSlot: targetSlot,
        reason,
      }).finally(() => {
        this.setData({ changeRequestSubmitting: false });
      });
    });
  },

  prepareSeatChangeStep() {
    this.setData({
      changeRequestSelectedType: 'seat_change',
      changeRequestPanelStep: 'seat_change',
      changeRequestSeatKeyword: '',
      changeRequestSeatCandidates: [],
      changeRequestSelectedSeatId: -1,
    });
    this.loadSeatCandidatesForChangeRequest('');
  },

  onChangeSeatKeywordInput(e: any) {
    const value =
      typeof e?.detail === 'string'
        ? e.detail
        : typeof e?.detail?.value === 'string'
          ? e.detail.value
          : '';
    this.setData({ changeRequestSeatKeyword: value });
  },

  onSearchSeatCandidates() {
    const keyword = String(this.data.changeRequestSeatKeyword || '').trim();
    this.loadSeatCandidatesForChangeRequest(keyword);
  },

  loadSeatCandidatesForChangeRequest(keyword = '') {
    const reservation = this.getChangeRequestReservation();
    if (!reservation) {
      showSimpleModal(t('myReservation.hint.loadFailed'));
      return;
    }

    this.setData({ changeRequestSeatLoading: true });
    searchSeats(keyword, {
      date: String(reservation.date || ''),
      timeSlot: reservation.timeSlot,
    })
      .then((res: any) => {
        const list = Array.isArray(res?.data?.list)
          ? res.data.list
          : Array.isArray(res?.data)
            ? res.data
            : [];

        const candidates = list
          .filter((seat: any) => Number(seat?.status) === 0)
          .filter((seat: any) => String(seat?.id) !== String(reservation.booking?.seatId || ''))
          .map((seat: any) => ({
            id: Number(seat.id),
            label: buildSeatCandidateLabel(seat),
          }))
          .filter((item: any) => Number.isFinite(item.id) && item.label);

        this.setData({
          changeRequestSeatCandidates: candidates,
          changeRequestSelectedSeatId: candidates[0]?.id ?? -1,
        });

        if (candidates.length === 0) {
          showSimpleModal(t('myReservation.changeRequest.hint.noSeatCandidate'));
        }
      })
      .catch(() => {
        showSimpleModal(t('myReservation.changeRequest.hint.loadSeatFailed'));
      })
      .finally(() => {
        this.setData({ changeRequestSeatLoading: false });
      });
  },

  onPickSeatCandidate(e: any) {
    const seatId = Number(e.currentTarget?.dataset?.id);
    if (!Number.isInteger(seatId)) return;
    this.setData({ changeRequestSelectedSeatId: seatId });
  },

  onConfirmSeatChange() {
    const bookingId = Number(this.data.changeRequestBookingId);
    const targetSeatId = Number(this.data.changeRequestSelectedSeatId);
    const reason = String(this.data.changeRequestReasonInput || '').trim();

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0 ||
      !Number.isInteger(targetSeatId) ||
      targetSeatId <= 0
    ) {
      showSimpleModal(t('myReservation.changeRequest.hint.noSeatCandidate'));
      return;
    }
    if (!reason) {
      showSimpleModal(t('myReservation.changeRequest.reason.required'));
      return;
    }

    this.setData({ changeRequestSubmitting: true }, () => {
      this.submitChangeRequest({
        bookingId,
        changeType: 'seat_change',
        targetSeatId,
        reason,
      }).finally(() => {
        this.setData({ changeRequestSubmitting: false });
      });
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
});
