import { t } from '../../utils/i18n';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../apis/notification';
import { isLogin, redirectToLogin } from '../../utils/auth';
import { calcHasMore, mergeUniqueByKey } from '../../utils/pagination';

const NotificationType = {
  SYSTEM: 0,
  RESERVATION: 1,
  ACTIVITY: 2,
  MARKETING: 3,
} as const;

type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

const NotificationTypeName: Record<NotificationTypeValue, string> = {
  [NotificationType.SYSTEM]: 'system',
  [NotificationType.RESERVATION]: 'reservation',
  [NotificationType.ACTIVITY]: 'activity',
  [NotificationType.MARKETING]: 'marketing',
};

interface NotificationItem {
  id: string;
  type: NotificationTypeValue;
  typeText: string;
  icon: string;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
}

function localizeNotificationText(
  title: string,
  content: string,
  type: NotificationTypeValue,
  currentLang: string
) {
  if (currentLang === 'zh' && type === NotificationType.RESERVATION) {
    if (/booking successful/i.test(title)) {
      title = '预约成功';
    }
    const match = /You have successfully booked a seat on\s*(\d{4}-\d{2}-\d{2})/i.exec(content);
    if (match) {
      content = `您已成功预约座位，日期：${match[1]}`;
    }
  }
  return { title, content };
}

Page({
  data: {
    currentLang: 'zh',
    languageClass: 'lang-zh',
    pageTitle: '',
    markAllReadText: '',
    markReadText: '',
    viewDetailText: '',
    readText: '',
    unreadText: '',
    emptyText: '',
    hasUnread: false,
    hasNotifications: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    loadingMore: false,
    loadingMoreText: '',
    noMoreText: '',
    currentFilter: 'all',
    filterTabs: [
      { label: '全部', value: 'all' },
      { label: '未读', value: 'unread' },
      { label: '系统通知', value: NotificationType.SYSTEM },
      { label: '活动通知', value: NotificationType.ACTIVITY },
      { label: '预约通知', value: NotificationType.RESERVATION },
    ],
    notificationList: [] as NotificationItem[],
  },

  _allNotifications: [] as NotificationItem[],

  onLoad() {
    this.updateLanguage();
    this.loadNotifications(true);
  },

  onShow() {
    this.updateLanguage();
    this.loadNotifications(true);
  },

  onReachBottom() {
    this.loadNotifications(false);
  },

  loadNotifications(reset = true) {
    if (!isLogin()) {
      redirectToLogin('/pages/notification/notification');
      return;
    }

    if (!reset) {
      if (this.data.loadingMore || !this.data.hasMore) return;
      this.setData({ loadingMore: true });
    }

    const targetPage = reset ? 1 : this.data.page + 1;

    getNotifications({ page: targetPage, limit: this.data.pageSize })
      .then((res: any) => {
        const responseData = res.data as any;
        const list = Array.isArray(responseData?.list) ? responseData.list : [];
        const total = Number(responseData?.total || 0);

        const iconMap: Record<NotificationTypeValue, string> = {
          [NotificationType.SYSTEM]: 'warning-o',
          [NotificationType.RESERVATION]: 'success',
          [NotificationType.ACTIVITY]: 'gift-o',
          [NotificationType.MARKETING]: 'coupon-o',
        };

        const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
        const mapped: NotificationItem[] = list.map((item: any) => {
          const rawType = Number(item.type);
          const type: NotificationTypeValue =
            rawType === NotificationType.RESERVATION ||
            rawType === NotificationType.ACTIVITY ||
            rawType === NotificationType.MARKETING
              ? rawType
              : NotificationType.SYSTEM;
          const localized = localizeNotificationText(
            item.title || '',
            item.content || '',
            type,
            currentLang
          );
          return {
            id: String(item.id),
            type,
            typeText: t(`notification.type.${NotificationTypeName[type]}`),
            icon: iconMap[type] || 'info-o',
            title: localized.title,
            content: localized.content,
            time: item.time || item.createdAt || '',
            isRead: !!item.isRead,
          };
        });

        const nextAll = reset
          ? mapped
          : mergeUniqueByKey((this as any)._allNotifications || [], mapped, (item) => item.id);
        (this as any)._allNotifications = nextAll;

        this.setData({
          page: targetPage,
          hasMore: calcHasMore({
            page: targetPage,
            pageSize: this.data.pageSize,
            total,
            batchSize: list.length,
          }),
          loadingMore: false,
        });
        this.applyFilter(this.data.currentFilter);
      })
      .catch((err) => {
        console.error('鍔犺浇閫氱煡澶辫触:', err);
        this.setData({ loadingMore: false });
      });
  },

  updateLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    this.setData({
      currentLang,
      languageClass: currentLang === 'zh' ? 'lang-zh' : 'lang-en',
      pageTitle: t('common.quick.notificationCenter'),
      markAllReadText: t('notification.markAllRead'),
      markReadText: t('notification.markRead'),
      viewDetailText: t('common.btn.detail'),
      readText: t('notification.read'),
      unreadText: t('notification.unread'),
      emptyText: t('common.empty.notification'),
      loadingMoreText: t('common.hint.loading'),
      noMoreText: t('common.hint.noMore'),
      filterTabs: [
        { label: t('notification.filter.all'), value: 'all' },
        { label: t('notification.filter.unread'), value: 'unread' },
        { label: t('notification.filter.system'), value: NotificationType.SYSTEM },
        { label: t('notification.filter.activity'), value: NotificationType.ACTIVITY },
        { label: t('notification.filter.reservation'), value: NotificationType.RESERVATION },
      ],
    });
  },

  applyFilter(filterValue: string | number) {
    const allList = (this as any)._allNotifications || [];
    let filteredList = allList;

    if (filterValue === 'unread') {
      filteredList = allList.filter((item: NotificationItem) => !item.isRead);
    } else if (filterValue !== 'all') {
      if (typeof filterValue === 'number') {
        filteredList = allList.filter((item: NotificationItem) => item.type === filterValue);
      } else {
        filteredList = allList.filter(
          (item: NotificationItem) => item.type === Number(filterValue)
        );
      }
    }

    this.setData({
      currentFilter: String(filterValue),
      notificationList: filteredList,
      hasUnread: allList.some((item: NotificationItem) => !item.isRead),
      hasNotifications: allList.length > 0,
    });
  },

  onMarkAllRead() {
    markAllAsRead()
      .then(() => {
        this.loadNotifications(true);
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      });
  },

  onFilterChange(event: WechatMiniprogram.CustomEvent) {
    const index = event.detail.index as number;
    const selectedTab = this.data.filterTabs[index];
    if (selectedTab) {
      this.applyFilter(selectedTab.value);
    }
  },

  onCardTap() {},

  onActionTap(event: WechatMiniprogram.CustomEvent) {
    const action = (event.detail.action as string) || event.currentTarget.dataset.action;
    const notifId = (event.detail.id as string) || event.currentTarget.dataset.id;

    if (action === 'viewDetail') {
      wx.navigateTo({
        url: `/pages/notification-detail/notification-detail?id=${notifId}`,
      });
      return;
    }

    if (action === 'markRead' && notifId) {
      markAsRead(notifId)
        .then(() => {
          this.loadNotifications(true);
        })
        .catch(() => {
          wx.showToast({ title: t('common.hint.error'), icon: 'none' });
        });
      return;
    }

    if (action === 'markAllRead') {
      this.onMarkAllRead();
      return;
    }

    if (action === 'delete' && notifId) {
      wx.showModal({
        title: t('common.dialog.confirmDelete'),
        content: t('notification.confirm.deleteContent'),
        success: (res) => {
          if (!res.confirm) return;
          deleteNotification(notifId)
            .then(() => {
              wx.showToast({ title: t('common.toast.deleteSuccess'), icon: 'success' });
              this.loadNotifications(true);
            })
            .catch(() => {
              wx.showToast({ title: t('common.toast.deleteFailed'), icon: 'none' });
            });
        },
      });
    }
  },
});
