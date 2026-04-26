import { getMyChangeRequests, withdrawChangeRequest } from '../../apis/changeRequest';
import { getTimeSlotConfigs } from '../../apis/config';
import { getLangClassName, t } from '../../utils/i18n';
import { isLogin } from '../../utils/auth';
import { maskName } from '../../utils/util';
import {
  buildTimeSlotConfigs,
  buildTimeSlotNameMap,
  getFallbackTimeSlotConfigs,
} from '../../utils/time-slot';

interface MyRequestItem {
  id: string;
  bookingId: number;
  changeType: 'cancel' | 'reschedule' | 'seat_change';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  reviewComment: string;
  targetDate: string;
  targetTimeSlot: number;
  targetTimeSlotLabel?: string;
  targetSeatId: number;
  targetSeatLabel?: string;
  createdAt: string;
  createdAtText?: string;
  reviewedAt: string;
  reviewedAtText?: string;
  reviewerName: string;
  typeText?: string;
  statusText?: string;
  statusTagType?: 'warning' | 'success' | 'danger';
  targetText?: string;
}

interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

function parseTotalFromResponse(res: any) {
  const payload = res?.data || {};
  return Number(payload.total || 0);
}

function formatDateTime(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function resolveReviewerName(input: any) {
  const raw =
    typeof input === 'object' && input !== null
      ? input.nickname || input.name || input.username || ''
      : input;
  const name = String(raw || '').trim();
  if (!name) return '';
  if (/^bench\s*user$/i.test(name)) return '';
  return maskName(name);
}

Page({
  data: {
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    emptyHint: '',
    loadingHint: '',
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    requestList: [] as MyRequestItem[],
    statusTabs: [] as Array<{ id: string; name: string }>,
    currentStatus: 'all',
    noMoreHint: '',
    loadingMore: false,
    labelTarget: '',
    labelReason: '',
    labelReviewComment: '',
    labelReviewedAt: '',
    labelReviewer: '',
    pendingWithdrawText: '',
    summaryTitle: '',
    summaryTotalText: '',
    summaryPendingText: '',
    summaryApprovedText: '',
    summaryRejectedText: '',
    requestStats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    } as RequestStats,
    timeSlotConfigs: [] as Array<{ slot: number; label: string }>,
  },

  onLoad() {
    this.updateLanguage();
    this.refreshOverallStats();
    this.loadRequests(true);
  },

  onShow() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    if (currentLang !== this.data.currentLang) {
      this.updateLanguage();
    }
    this.refreshOverallStats();
    this.loadRequests(true);
  },

  onPullDownRefresh() {
    this.loadRequests(true);
  },

  onReachBottom() {
    this.loadRequests(false);
  },

  updateLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('common.quick.myRequests'),
      emptyHint: t('common.empty.changeRequest'),
      loadingHint: t('common.hint.loading'),
      noMoreHint: t('common.hint.noMore'),
      labelTarget: t('myRequests.detail.target'),
      labelReason: t('myRequests.detail.reason'),
      labelReviewComment: t('myRequests.detail.reviewComment'),
      labelReviewedAt: t('myRequests.detail.reviewedAt'),
      labelReviewer: t('myRequests.detail.reviewer'),
      pendingWithdrawText: t('myRequests.action.withdraw') || '撤回申请',
      summaryTitle: t('myRequests.summary.title'),
      summaryTotalText: t('myRequests.summary.total'),
      summaryPendingText: t('myRequests.summary.pending'),
      summaryApprovedText: t('myRequests.summary.approved'),
      summaryRejectedText: t('myRequests.summary.rejected'),
      statusTabs: [
        { id: 'all', name: t('common.status.all') },
        { id: 'pending', name: t('myRequests.status.pending') },
        { id: 'approved', name: t('myRequests.status.approved') },
        { id: 'rejected', name: t('myRequests.status.rejected') },
      ],
    });
  },

  refreshData() {
    this.refreshOverallStats();
    this.loadRequests(true);
  },

  async ensureTimeSlotConfigs() {
    const cached = Array.isArray(this.data.timeSlotConfigs) ? this.data.timeSlotConfigs : [];
    if (cached.length > 0) return cached;

    try {
      const res: any = await getTimeSlotConfigs();
      const configs = buildTimeSlotConfigs(Array.isArray(res?.data) ? res.data : []);
      if (configs.length > 0) {
        this.setData({ timeSlotConfigs: configs });
        return configs;
      }
    } catch (error) {
      console.warn('加载时段配置失败，使用默认时段名称', error);
    }

    const fallback = getFallbackTimeSlotConfigs();
    this.setData({ timeSlotConfigs: fallback });
    return fallback;
  },

  refreshOverallStats() {
    if (!isLogin()) return;

    Promise.all([
      getMyChangeRequests({ page: 1, pageSize: 1 }),
      getMyChangeRequests({ page: 1, pageSize: 1, status: 'pending' }),
      getMyChangeRequests({ page: 1, pageSize: 1, status: 'approved' }),
      getMyChangeRequests({ page: 1, pageSize: 1, status: 'rejected' }),
    ])
      .then(([allRes, pendingRes, approvedRes, rejectedRes]) => {
        this.setData({
          requestStats: {
            total: parseTotalFromResponse(allRes),
            pending: parseTotalFromResponse(pendingRes),
            approved: parseTotalFromResponse(approvedRes),
            rejected: parseTotalFromResponse(rejectedRes),
          },
        });
      })
      .catch(() => {
        // Keep previous summary values if stats refresh fails.
      });
  },

  loadRequests(reset = true) {
    if (!isLogin()) {
      this.setData({
        loading: false,
        loadingMore: false,
        hasMore: false,
        requestList: [],
        requestStats: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      });
      wx.stopPullDownRefresh();
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
      this.setData({ loading: true });
      wx.showLoading({ title: this.data.loadingHint });
    }

    const status = this.data.currentStatus === 'all' ? undefined : this.data.currentStatus;
    Promise.all([
      getMyChangeRequests({
        page: targetPage,
        pageSize: this.data.pageSize,
        status,
      }),
      this.ensureTimeSlotConfigs(),
    ])
      .then(([res]: [any, Array<{ slot: number; label: string }>]) => {
        const payload = res?.data || {};
        const list = Array.isArray(payload.list)
          ? payload.list
          : Array.isArray(payload.requests)
            ? payload.requests
            : [];
        const total = Number(payload.total || 0);

        const mappedList: MyRequestItem[] = list.map((item: any) => {
          const baseItem: MyRequestItem = {
            id: String(item.id),
            bookingId: Number(item.bookingId || 0),
            changeType: (item.changeType || item.type || 'cancel') as any,
            status: (item.status || 'pending') as any,
            reason: String(item.reason || ''),
            reviewComment: String(item.reviewComment || ''),
            targetDate: String(item.targetDate || item.newDate || ''),
            targetTimeSlot: Number(
              item.targetTimeSlot !== undefined ? item.targetTimeSlot : item.newTimeSlot
            ),
            targetTimeSlotLabel: String(item.targetTimeSlotLabel || '').trim(),
            targetSeatId: Number(item.targetSeatId || item.newSeatId || 0),
            targetSeatLabel: String(item.targetSeatLabel || '').trim(),
            createdAt: String(item.createdAt || item.created_at || ''),
            createdAtText: formatDateTime(item.createdAt || item.created_at || ''),
            reviewedAt: String(item.reviewedAt || item.reviewed_at || ''),
            reviewedAtText: formatDateTime(item.reviewedAt || item.reviewed_at || ''),
            reviewerName: resolveReviewerName(
              item.reviewerName || item.reviewedByName || item.reviewedBy
            ),
          };

          return {
            ...baseItem,
            typeText: this.getTypeText(baseItem.changeType),
            statusText: this.getStatusText(baseItem.status),
            statusTagType: this.getStatusTagType(baseItem.status),
            targetText: this.getTargetText(baseItem),
          };
        });

        const merged = reset ? mappedList : [...this.data.requestList, ...mappedList];
        const uniqueMerged = Array.from(
          new Map(merged.map((item) => [String(item.id), item])).values()
        );

        const hasMore = uniqueMerged.length < total && mappedList.length > 0;
        this.setData({
          requestList: uniqueMerged,
          page: targetPage,
          hasMore,
          loading: false,
          loadingMore: false,
        });

        if (reset) {
          wx.hideLoading();
        }
        wx.stopPullDownRefresh();
      })
      .catch((error) => {
        this.setData({ loading: false, loadingMore: false });
        wx.hideLoading();
        wx.stopPullDownRefresh();
        const backendMessage = String(error?.message || '').trim();
        const backendCode = String(error?.code || '').trim();
        const detail = backendCode
          ? `${backendMessage || t('common.hint.error')} (${backendCode})`
          : backendMessage || t('common.hint.error');
        wx.showToast({ title: detail.slice(0, 32), icon: 'none' });
      });
  },

  onStatusChange(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const status = String(event?.detail?.id || 'all');
    this.setData({ currentStatus: status }, () => {
      this.loadRequests(true);
    });
  },

  getStatusText(status: string) {
    if (status === 'approved') return t('myRequests.status.approved');
    if (status === 'rejected') return t('myRequests.status.rejected');
    return t('myRequests.status.pending');
  },

  getStatusTagType(status: string) {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'warning';
  },

  getTypeText(type: string) {
    if (type === 'reschedule') return t('myRequests.type.reschedule');
    if (type === 'seat_change') return t('myRequests.type.seatChange');
    return t('myRequests.type.cancel');
  },

  getTargetText(item: MyRequestItem) {
    if (item.changeType === 'cancel') return t('myRequests.target.cancel');

    if (item.changeType === 'reschedule') {
      const slotConfigs = Array.isArray(this.data.timeSlotConfigs) ? this.data.timeSlotConfigs : [];
      const slotMap = buildTimeSlotNameMap(
        slotConfigs.length > 0 ? slotConfigs : getFallbackTimeSlotConfigs()
      );
      const slotText =
        item.targetTimeSlotLabel ||
        slotMap[item.targetTimeSlot] ||
        String(item.targetTimeSlot || '-');
      return `${item.targetDate || '-'} ${slotText}`;
    }

    if (item.targetSeatLabel) return item.targetSeatLabel;
    return item.targetSeatId ? `${t('myRequests.target.seat')} #${item.targetSeatId}` : '-';
  },

  onWithdrawTap(event: any) {
    const id = String(event?.currentTarget?.dataset?.id || '');
    const record = this.data.requestList.find((item) => item.id === id);
    if (!record || record.status !== 'pending') return;

    wx.showModal({
      title: t('common.hint.confirm'),
      content: t('myRequests.confirm.withdraw') || '确定要撤回该申请吗？',
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (confirmRes) => {
        if (!confirmRes.confirm) return;
        withdrawChangeRequest(Number(record.id))
          .then(() => {
            wx.showToast({ title: t('common.hint.success') || '撤回成功', icon: 'success' });
            this.refreshData();
          })
          .catch(() => {
            wx.showToast({ title: t('common.hint.error') || '操作失败', icon: 'none' });
          });
      },
    });
  },
});
