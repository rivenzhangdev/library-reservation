import { cancelActivity, getActivityDetail, joinActivity } from '../../apis/activity';
import { isLogin } from '../../utils/auth';
import { resolveAssetUrl } from '../../utils/assets';
import { t } from '../../utils/i18n';

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function getStatusMeta(status: any) {
  const map: Record<string, { text: string; type: string }> = {
    '0': { text: t('common.status.upcoming'), type: 'warning' },
    '1': { text: t('common.status.ongoing'), type: 'success' },
    '2': { text: t('activity.status.ended'), type: 'default' },
  };
  return (
    map[String(status)] || {
      text: t('common.field.status'),
      type: 'default',
    }
  );
}

Page({
  data: {
    navTitle: '',
    activityId: '',
    activity: null as any,
    languageClass: '',
    currentLang: 'zh' as 'zh' | 'en',
    joinedText: '',
    notJoinedText: '',
    participantsLabel: '',
    locationLabel: '',
    timeLabel: '',
    dateLabel: '',
    descriptionLabel: '',
    auditInfoLabel: '',
    organizerLabel: '',
    updatedByLabel: '',
    joinNowText: '',
    cancelJoinText: '',
    notFoundText: '',
  },

  onLoad(options: Record<string, string>) {
    const activityId = options.id || '';
    this.setData({
      activityId,
    });
    this.updateLanguage();
    if (activityId) {
      this.loadDetail(activityId);
    }
  },

  onShow() {
    this.updateLanguage();
    if (this.data.activityId) {
      this.loadDetail(this.data.activityId);
    }
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    this.setData({
      navTitle: t('activity.detail.title'),
      languageClass: app.globalData.languageClass || 'lang-zh',
      currentLang: app.globalData.currentLang || 'zh',
      joinedText: t('activity.detail.joined'),
      notJoinedText: t('activity.detail.notJoined'),
      participantsLabel: t('common.field.participants'),
      locationLabel: t('activity.detail.location'),
      timeLabel: t('activity.detail.time'),
      dateLabel: t('common.field.date'),
      descriptionLabel: t('activity.detail.description'),
      auditInfoLabel: t('myReservation.detail.auditInfo'),
      organizerLabel: t('activity.detail.organizer'),
      updatedByLabel: t('activity.detail.updatedBy'),
      joinNowText: t('activity.detail.joinNow'),
      cancelJoinText: t('activity.detail.cancelJoin'),
      notFoundText: t('common.empty.notFound'),
    });
  },

  loadDetail(activityId: string) {
    getActivityDetail(activityId)
      .then((res: any) => {
        const detail = res.data || {};
        const participants = Array.isArray(detail.participants) ? detail.participants : [];
        const currentUserId = getApp<IAppOption>().globalData?.userInfo?.id || '';
        const isJoined = participants.some(
          (item: any) =>
            String(typeof item === 'string' ? item : item?._id || item?.id || '') ===
            String(currentUserId)
        );
        const statusMeta = getStatusMeta(detail.status);
        const maxParticipants = Number(detail.maxParticipants || 0);
        const participantCount = participants.length;
        const participantRate =
          maxParticipants > 0
            ? `${Math.min(100, Math.round((participantCount / maxParticipants) * 100))}%`
            : '0%';

        this.setData({
          activity: {
            ...detail,
            image: resolveAssetUrl(detail.coverImage),
            isJoined,
            participantCount,
            participantRate,
            statusText: statusMeta.text,
            statusType: statusMeta.type,
            canJoin: String(detail.status) === '0' && !isJoined,
            canCancel: isJoined && String(detail.status) !== '2',
            scheduleText: `${formatDateTime(detail.startTime)} - ${formatDateTime(detail.endTime)}`,
            locationText: [detail.floorName, detail.location].filter(Boolean).join(' / ') || '-',
            publisherName:
              detail.createdByName || detail.updatedByName || detail.publisherName || '-',
            updaterName: detail.updatedByName || detail.createdByName || '-',
            descriptionText: detail.description || t('common.empty.noDescription'),
          },
        });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      });
  },

  ensureLogin() {
    if (isLogin()) return true;
    wx.showToast({ title: t('common.hint.pleaseLogin'), icon: 'none' });
    return false;
  },

  onJoin() {
    if (!this.ensureLogin()) return;
    wx.showModal({
      title: t('activity.confirm.registerTitle'),
      content: t('activity.confirm.registerContent'),
      success: (res) => {
        if (!res.confirm) return;
        joinActivity(this.data.activityId)
          .then(() => {
            wx.showToast({ title: t('activity.toast.registerSuccess'), icon: 'success' });
            this.loadDetail(this.data.activityId);
          })
          .catch(() => {
            wx.showToast({ title: t('activity.toast.registerFailed'), icon: 'none' });
          });
      },
    });
  },

  onCancelJoin() {
    if (!this.ensureLogin()) return;
    wx.showModal({
      title: t('activity.detail.cancelJoin'),
      content:
        this.data.currentLang === 'zh'
          ? '确认取消本次活动报名吗？'
          : 'Are you sure you want to cancel this registration?',
      success: (res) => {
        if (!res.confirm) return;
        cancelActivity(this.data.activityId)
          .then(() => {
            wx.showToast({ title: t('activity.toast.cancelSuccess'), icon: 'success' });
            this.loadDetail(this.data.activityId);
          })
          .catch(() => {
            wx.showToast({ title: t('activity.toast.cancelFailed'), icon: 'none' });
          });
      },
    });
  },
});
