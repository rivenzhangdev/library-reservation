import { getNotificationDetail, markAsRead } from '../../apis/notification';
import { t } from '../../utils/i18n';

function getTypeLabel(type: any) {
  const map: Record<string, string> = {
    '0': t('notification.type.system'),
    '1': t('notification.type.reservation'),
    '2': t('notification.type.activity'),
    system: t('notification.type.system'),
    reservation: t('notification.type.reservation'),
    activity: t('notification.type.activity'),
  };
  return map[String(type)] || t('notification.type.system');
}

Page({
  data: {
    navTitle: '',
    notificationId: '',
    detail: null as any,
  },

  onLoad(options: Record<string, string>) {
    const notificationId = options.id || '';
    this.setData({
      navTitle: t('notification.detail.title'),
      notificationId,
    });
    if (notificationId) {
      this.loadDetail(notificationId);
    }
  },

  onShow() {
    this.setData({ navTitle: t('notification.detail.title') });
  },

  loadDetail(notificationId: string) {
    getNotificationDetail(notificationId)
      .then((res: any) => {
        const detail = res.data || {};
        this.setData({
          detail: {
            ...detail,
            typeText: getTypeLabel(detail.type),
          },
        });
        if (!detail.isRead) {
          markAsRead(notificationId).catch(() => {});
        }
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      });
  },
});
