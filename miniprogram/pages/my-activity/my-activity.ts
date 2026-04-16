import { cancelActivity, getActivities, joinActivity } from '../../apis/activity';
import { isLogin } from '../../utils/auth';
import { resolveAssetUrl } from '../../utils/assets';
import { formatDateTime } from '../../utils/time';
import { getLangClassName, t } from '../../utils/i18n';

function resolveActivityPublisher(activity: any): string {
  if (!activity) return '-';
  return activity.createdByName || '-';
}

const ACTIVITY_STATUS_MAP: Record<number, string> = {
  0: 'upcoming',
  1: 'ongoing',
  2: 'ended',
};

interface ActivityItem {
  id: string;
  title: string;
  image: string;
  startDate: string;
  endDate: string;
  timeRange: string;
  location: string;
  participants: number;
  maxParticipants: number;
  description: string;
  publisher: string;
  status: 'all' | 'registered' | 'ongoing' | 'upcoming' | 'ended';
  tags: Array<{
    text: string;
    position: 'left' | 'right';
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  }>;
  buttons?: Array<{
    text: string;
    action: string;
    type: string;
  }>;
}

Page({
  data: {
    currentStatus: 'all',
    statusList: [] as Array<{ id: string; name: string }>,
    activities: [] as ActivityItem[],
    filteredActivities: [] as ActivityItem[],
    activityButtons: {} as Record<string, Array<{ text: string; action: string; type: string }>>,
    searchValue: '',
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    searchPlaceholder: '',
    searchingHint: '',
    emptyHint: '',
    detailText: '',
    registerText: '',
    cancelText: '',
    participantsText: '',
    publisherLabel: '',
  },

  onLoad() {
    this.initLanguage();
    this.loadActivities();
  },

  onShow() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    if (currentLang !== this.data.currentLang) {
      this.initLanguage();
    }
    this.loadActivities();
  },

  initLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';

    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('activity.title'),
      searchPlaceholder: t('activity.search.placeholder'),
      searchingHint: t('common.hint.loading'),
      emptyHint: t('activity.empty'),
      detailText: t('activity.btn.detail'),
      registerText: t('activity.btn.register'),
      cancelText: t('activity.action.cancel'),
      participantsText: t('activity.participants'),
      publisherLabel: t('common.field.publisher'),
      statusList: [
        { id: 'all', name: t('common.status.all') },
        { id: 'registered', name: t('activity.status.registered') },
        { id: 'ongoing', name: t('common.status.ongoing') },
        { id: 'upcoming', name: t('common.status.upcoming') },
        { id: 'ended', name: t('activity.status.ended') },
      ],
    });

    this.initActivityButtons();
  },

  initActivityButtons() {
    const { detailText, registerText, cancelText } = this.data;
    this.setData({
      activityButtons: {
        registered: [
          { text: detailText, action: 'detail', type: '' },
          { text: cancelText, action: 'cancel', type: 'primary' },
        ],
        ongoing: [{ text: detailText, action: 'detail', type: 'primary' }],
        upcoming: [
          { text: detailText, action: 'detail', type: '' },
          { text: registerText, action: 'register', type: 'primary' },
        ],
        ended: [{ text: detailText, action: 'detail', type: 'full' }],
      },
    });
  },

  loadActivities() {
    if (!isLogin()) return;

    wx.showLoading({ title: this.data.searchingHint });

    getActivities()
      .then((res: any) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.list || res.data?.activities || [];
        const userId = getApp<IAppOption>().globalData?.userInfo?.id || '';

        const activities: ActivityItem[] = list.map((activity: any) => {
          const participants = Array.isArray(activity.participants) ? activity.participants : [];
          const isJoined = participants.some(
            (item: any) =>
              String(typeof item === 'string' ? item : item?._id || item?.id || '') ===
              String(userId)
          );

          const rawStatus = (ACTIVITY_STATUS_MAP[activity.status] ||
            activity.status ||
            'upcoming') as ActivityItem['status'];
          const status = isJoined && rawStatus !== 'ended' ? 'registered' : rawStatus;
          const tags: ActivityItem['tags'] = [];

          if (isJoined) {
            tags.push({ text: t('activity.tag.registered'), position: 'left', type: 'primary' });
          }

          if (rawStatus === 'ongoing') {
            tags.push({ text: t('common.status.ongoing'), position: 'right', type: 'success' });
          } else if (rawStatus === 'upcoming') {
            tags.push({ text: t('common.status.upcoming'), position: 'right', type: 'warning' });
          } else {
            tags.push({ text: t('activity.status.ended'), position: 'right', type: 'default' });
          }

          const startDate = formatDateTime(activity.startTime);
          const endDate = formatDateTime(activity.endTime);

          return {
            id: String(activity._id || activity.id),
            title: activity.title || '-',
            image: resolveAssetUrl(activity.coverImage),
            startDate,
            endDate,
            timeRange: `${startDate}${endDate ? ` - ${endDate}` : ''}`,
            location: activity.location || '-',
            participants: participants.length,
            maxParticipants: Number(activity.maxParticipants || 0),
            description: activity.description || t('common.empty.noDescription'),
            publisher: resolveActivityPublisher(activity),
            status,
            tags,
            buttons: this.data.activityButtons[status] || this.data.activityButtons.ended || [],
          };
        });

        this.setData({
          activities,
        });
        this.filterActivities();
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onSearchChange(e: WechatMiniprogram.CustomEvent) {
    const value = typeof e.detail === 'string' ? e.detail : e.detail?.value || '';
    this.setData({ searchValue: String(value) });
    clearTimeout((this as any).searchTimer);
    (this as any).searchTimer = setTimeout(() => {
      this.filterActivities();
    }, 250);
  },

  onStatusChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ currentStatus: e.detail.id });
    this.filterActivities();
  },

  filterActivities() {
    const { activities, currentStatus, searchValue } = this.data;
    const keyword = String(searchValue || '').trim();

    let filtered = [...activities];
    if (currentStatus !== 'all') {
      filtered = filtered.filter((item) => item.status === currentStatus);
    }

    if (keyword) {
      filtered = filtered.filter(
        (item) =>
          item.title.includes(keyword) ||
          item.location.includes(keyword) ||
          item.description.includes(keyword) ||
          item.publisher.includes(keyword)
      );
    }

    this.setData({ filteredActivities: filtered });
  },

  onDetailTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${id}`,
    });
  },

  onActionTap(e: WechatMiniprogram.TouchEvent) {
    const { action } = e.currentTarget.dataset as { action?: string };
    if (action === 'register') {
      this.onRegisterTap(e);
      return;
    }
    if (action === 'cancel') {
      this.onCancelTap(e);
      return;
    }
    this.onDetailTap(e);
  },

  onRegisterTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: t('activity.confirm.registerTitle'),
      content: t('activity.confirm.registerContent'),
      success: (res) => {
        if (!res.confirm) return;
        joinActivity(String(id))
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

  onCancelTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: t('activity.action.cancel'),
      content: t('activity.action.cancel'),
      success: (res) => {
        if (!res.confirm) return;
        cancelActivity(String(id))
          .then(() => {
            wx.showToast({ title: t('activity.toast.cancelSuccess'), icon: 'success' });
            this.loadActivities();
          })
          .catch(() => {
            wx.showToast({ title: t('activity.toast.cancelFailed'), icon: 'none' });
          });
      },
    });
  },
});
