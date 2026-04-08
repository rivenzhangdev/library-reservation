import { t } from '../../utils/i18n';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../apis/notification';
import { isLogin } from '../../utils/auth';

interface NotificationItem {
  id: string;
  type: 'reservation' | 'system' | 'activity' | 'marketing';
  icon: string;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
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
    currentFilter: 'all',
    filterTabs: [
      { label: '全部', value: 'all' },
      { label: '未读', value: 'unread' },
      { label: '系统通知', value: 'system' },
      { label: '活动通知', value: 'activity' },
      { label: '预约通知', value: 'reservation' },
    ],
    notificationList: [] as NotificationItem[],
  },

  _allNotifications: [] as NotificationItem[],

  onLoad() {
    this.updateLanguage();
    this.loadNotifications();
  },

  onShow() {
    this.updateLanguage();
    this.loadNotifications();
  },

  loadNotifications() {
    if (!isLogin()) return;

    getNotifications({ page: 1, limit: 50 })
      .then((res: any) => {
        const responseData = res.data as any;
        const list = Array.isArray(responseData)
          ? responseData
          : responseData?.notifications || responseData?.list || [];

        const typeNameMap: Record<number, NotificationItem['type']> = {
          0: 'system',
          1: 'reservation',
          2: 'activity',
          3: 'marketing',
        };
        const iconMap: Record<number, string> = {
          1: 'success',
          0: 'warning-o',
          2: 'gift-o',
          3: 'coupon-o',
        };

        const notifications: NotificationItem[] = list.map((item: any) => ({
          id: String(item._id || item.id),
          type: typeNameMap[item.type] || 'system',
          icon: iconMap[item.type] || 'info-o',
          title: item.title,
          content: item.content,
          time: item.time || item.createdAt || '',
          isRead: !!item.isRead,
        }));

        (this as any)._allNotifications = notifications;
        this.applyFilter(this.data.currentFilter);
      })
      .catch((err) => {
        console.error('鍔犺浇閫氱煡澶辫触:', err);
      });
  },

  updateLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    this.setData({
      currentLang,
      languageClass: currentLang === 'zh' ? 'lang-zh' : 'lang-en',
      pageTitle: t('notification.pageTitle'),
      markAllReadText: t('notification.markAllRead'),
      markReadText: t('notification.markRead'),
      viewDetailText: t('notification.viewDetail'),
      readText: t('notification.read'),
      unreadText: t('notification.unread'),
      emptyText: t('notification.empty'),
      filterTabs: [
        { label: t('notification.filter.all'), value: 'all' },
        { label: t('notification.filter.unread'), value: 'unread' },
        { label: t('notification.filter.system'), value: 'system' },
        { label: t('notification.filter.activity'), value: 'activity' },
        { label: t('notification.filter.reservation'), value: 'reservation' },
      ],
    });
  },

  applyFilter(filterValue: string) {
    const allList = (this as any)._allNotifications || [];
    let filteredList = allList;

    if (filterValue === 'unread') {
      filteredList = allList.filter((item: NotificationItem) => !item.isRead);
    } else if (filterValue !== 'all') {
      filteredList = allList.filter((item: NotificationItem) => item.type === filterValue);
    }

    this.setData({
      currentFilter: filterValue,
      notificationList: filteredList,
      hasUnread: allList.some((item: NotificationItem) => !item.isRead),
    });
  },

  onMarkAllRead() {
    markAllAsRead()
      .then(() => {
        this.loadNotifications();
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
    const action = event.detail.action as string;
    const notifId = event.detail.id as string;

    if (action === 'viewDetail') {
      wx.navigateTo({
        url: `/pages/notification-detail/notification-detail?id=${notifId}`,
      });
      return;
    }

    if (action === 'markRead' && notifId) {
      markAsRead(notifId)
        .then(() => {
          this.loadNotifications();
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
        title: t('notification.confirm.deleteTitle'),
        content: t('notification.confirm.deleteContent'),
        success: (res) => {
          if (!res.confirm) return;
          deleteNotification(notifId)
            .then(() => {
              wx.showToast({ title: t('notification.toast.deleteSuccess'), icon: 'success' });
              this.loadNotifications();
            })
            .catch(() => {
              wx.showToast({ title: t('notification.toast.deleteFailed'), icon: 'none' });
            });
        },
      });
    }
  },
});
