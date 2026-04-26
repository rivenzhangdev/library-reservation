import { t } from '../../utils/i18n';
import { getNotificationDetail, markAsRead } from '../../apis/notification';

const NotificationType = {
  SYSTEM: 0,
  RESERVATION: 1,
  ACTIVITY: 2,
  MARKETING: 3,
} as const;

const NotificationTypeName: Record<NotificationTypeValue, string> = {
  [NotificationType.SYSTEM]: 'system',
  [NotificationType.RESERVATION]: 'reservation',
  [NotificationType.ACTIVITY]: 'activity',
  [NotificationType.MARKETING]: 'marketing',
};

type NotificationTypeKey = keyof typeof NotificationType;

type NotificationTypeValue = (typeof NotificationType)[NotificationTypeKey];

function normalizeNotificationType(type: string | number): NotificationTypeValue {
  const typeNameMap: Record<string, NotificationTypeValue> = {
    '0': NotificationType.SYSTEM,
    '1': NotificationType.RESERVATION,
    '2': NotificationType.ACTIVITY,
    '3': NotificationType.MARKETING,
  };
  if (typeof type === 'number') {
    return [
      NotificationType.SYSTEM,
      NotificationType.RESERVATION,
      NotificationType.ACTIVITY,
      NotificationType.MARKETING,
    ].includes(type)
      ? (type as NotificationTypeValue)
      : NotificationType.SYSTEM;
  }
  return (typeNameMap[type] ?? NotificationTypeName[type as any])
    ? (type as NotificationTypeValue)
    : NotificationType.SYSTEM;
}

function getNotificationTypeText(type: string | number) {
  const normalized = normalizeNotificationType(type);
  return (
    t(`notification.type.${NotificationTypeName[normalized]}`) || NotificationTypeName[normalized]
  );
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

function buildExtraInfoRows(data: any) {
  const rows: Array<{ label: string; value: string }> = [];
  if (!data || typeof data !== 'object') return rows;

  const pushField = (key: string, labelKey: string) => {
    const value = data[key];
    if (value !== undefined && value !== null && value !== '') {
      rows.push({ label: t(labelKey), value: String(value) });
    }
  };

  pushField('bookingId', 'notification.detail.bookingId');
  pushField('seatId', 'notification.detail.seatId');
  pushField('date', 'notification.detail.date');
  pushField('timeSlot', 'notification.detail.timeSlot');

  const reservedKeys = ['bookingId', 'seatId', 'date', 'timeSlot'];
  Object.keys(data).forEach((key) => {
    if (reservedKeys.includes(key)) return;
    const value = data[key];
    if (value !== undefined && value !== null && value !== '') {
      rows.push({
        label: key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      });
    }
  });

  return rows;
}

Page({
  data: {
    currentLang: 'zh',
    languageClass: 'lang-zh',
    navTitle: '',
    basicInfoLabel: '',
    contentLabel: '',
    timeLabel: '',
    typeLabel: '',
    publisherLabel: '',
    updatedByLabel: '',
    relatedIdLabel: '',
    bookingIdLabel: '',
    seatIdLabel: '',
    bookingInfoLabel: '',
    extraInfoLabel: '',
    dateLabel: '',
    timeSlotLabel: '',
    viewRelatedText: '',
    loadingText: '',
    emptyText: '',
    notification: null as any,
    loading: true,
  },

  onLoad(options: Record<string, string>) {
    this.updateLanguage();
    const notificationId = options?.id || '';
    if (!notificationId) {
      this.setData({ loading: false });
      return;
    }
    this.loadNotification(notificationId);
  },

  onShow() {
    this.updateLanguage();
  },

  updateLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
    this.setData({
      currentLang,
      languageClass: currentLang === 'zh' ? 'lang-zh' : 'lang-en',
      navTitle: t('notification.detail.title'),
      basicInfoLabel: t('notification.detail.basicInfo'),
      contentLabel: t('notification.detail.content'),
      timeLabel: t('notification.detail.time'),
      typeLabel: t('notification.detail.type'),
      publisherLabel: t('notification.detail.publisher'),
      updatedByLabel: t('notification.detail.updatedBy'),
      relatedIdLabel: t('notification.detail.relatedId'),
      bookingIdLabel: t('notification.detail.bookingId'),
      seatIdLabel: t('notification.detail.seatId'),
      bookingInfoLabel: t('notification.detail.bookingInfo'),
      extraInfoLabel: t('notification.detail.extraInfo'),
      dateLabel: t('notification.detail.date'),
      timeSlotLabel: t('notification.detail.timeSlot'),
      viewRelatedText: t('common.btn.detail'),
      loadingText: t('common.hint.loading'),
      emptyText: t('common.hint.noData'),
    });
  },

  loadNotification(notificationId: string) {
    this.setData({ loading: true });
    getNotificationDetail(notificationId)
      .then((res: any) => {
        const responseData = res.data || {};
        const detail = responseData.data || responseData;
        const type = normalizeNotificationType(detail.type);
        const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';
        const localized = localizeNotificationText(
          detail.title || '',
          detail.content || '',
          type,
          currentLang
        );
        const notification = {
          ...detail,
          type,
          title: localized.title,
          content: localized.content,
          typeText: getNotificationTypeText(type),
          time: detail.time || detail.createdAt || '',
          isReadText: detail.isRead ? t('notification.read') : t('notification.unread'),
          extraInfoRows: buildExtraInfoRows(detail.data),
          publisherName:
            type === NotificationType.SYSTEM
              ? t('notification.detail.publisherSystem')
              : detail.publisherName || '-',
        };
        this.setData({ notification, loading: false });
        if (notification && !notification.isRead) {
          markAsRead(notificationId)
            .then(() => {
              this.setData({
                notification: {
                  ...this.data.notification,
                  isRead: true,
                  isReadText: t('notification.read'),
                },
              });
            })
            .catch(() => {
              // ignore mark-as-read failure
            });
        }
      })
      .catch((error) => {
        console.error('Load notification detail failed:', error);
        this.setData({ notification: null, loading: false });
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      });
  },

  onOpenRelated() {
    const notification = this.data.notification || {};
    if (!notification.relatedId) return;

    if (notification.type === NotificationType.ACTIVITY) {
      wx.navigateTo({
        url: `/pages/activity-detail/activity-detail?id=${notification.relatedId}`,
      });
      return;
    }

    wx.showToast({ title: this.data.emptyText, icon: 'none' });
  },
});
