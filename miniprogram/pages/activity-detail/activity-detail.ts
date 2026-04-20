import {
  cancelActivity,
  getActivityDetail,
  joinActivity,
  checkinActivity,
  checkoutActivity,
} from '../../apis/activity';
import { isLogin, redirectToLogin } from '../../utils/auth';
import { resolveAssetUrl } from '../../utils/assets';
import { t } from '../../utils/i18n';

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
    checkInText: '',
    checkOutText: '',
    signedInText: '',
    signedOutText: '',
    signStatusLabel: '',
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
      checkInText: t('common.btn.checkIn'),
      checkOutText: t('common.btn.checkOut'),
      signedInText: t('activity.detail.signedIn'),
      signedOutText: t('activity.detail.signedOut'),
      signStatusLabel: t('activity.detail.signStatus'),
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
            String(typeof item === 'string' ? item : item?.id || '') === String(currentUserId)
        );
        const statusMeta = getStatusMeta(detail.status);
        const maxParticipants = Number(detail.maxParticipants || 0);
        const participantCount = participants.length;
        const participantRate =
          maxParticipants > 0
            ? `${Math.min(100, Math.round((participantCount / maxParticipants) * 100))}%`
            : '0%';

        const checkedIn = Array.isArray(detail.checkedIn) ? detail.checkedIn : [];
        const checkedOut = Array.isArray(detail.checkedOut) ? detail.checkedOut : [];
        const isCheckedIn = checkedIn.some((item: any) => String(item) === String(currentUserId));
        const isCheckedOut = checkedOut.some((item: any) => String(item) === String(currentUserId));
        const canSignIn = isJoined && !isCheckedIn && String(detail.status) === '1';
        const canSignOut =
          isJoined && isCheckedIn && !isCheckedOut && String(detail.status) !== '0';
        const signStatusText = isCheckedOut
          ? t('activity.detail.signedOut')
          : isCheckedIn
            ? t('activity.detail.signedIn')
            : '';
        const signOutWarningText =
          Number(detail.status) === 2 && isCheckedIn && !isCheckedOut
            ? t('activity.detail.lateCheckoutWarning')
            : '';

        const fallbackPublisherName = detail.createdByName || '-';

        this.setData({
          activity: {
            ...detail,
            image: resolveAssetUrl(detail.coverImage),
            isJoined,
            isCheckedIn,
            isCheckedOut,
            participantCount,
            participantRate,
            statusText: statusMeta.text,
            statusType: statusMeta.type,
            canJoin:
              String(detail.status) === '0' &&
              !isJoined &&
              !(maxParticipants > 0 && participantCount >= maxParticipants),
            canCancel: isJoined && String(detail.status) !== '2',
            canSignIn,
            canSignOut,
            signStatusText,
            signOutWarningText,
            locationText: [detail.floorName, detail.location].filter(Boolean).join(' / ') || '-',
            publisherName: fallbackPublisherName,
            updaterName: detail.updatedByName || '',
            descriptionText: detail.description || t('common.empty.noDescription'),
            // 签到记录时间
            checkinTimeText: detail.checkinTime ? detail.checkinTime : '',
            checkoutTimeText: detail.checkoutTime ? detail.checkoutTime : '',
            scheduleText: `${detail.startTime || ''} - ${detail.endTime || ''}`,
          },
        });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      });
  },

  ensureLogin() {
    if (isLogin()) return true;
    redirectToLogin(`/pages/activity-detail/activity-detail?id=${this.data.activityId}`);
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

  onSignIn() {
    if (!this.ensureLogin()) return;
    checkinActivity(this.data.activityId)
      .then(() => {
        wx.showToast({ title: t('common.hint.checkInSuccess'), icon: 'success' });
        this.loadDetail(this.data.activityId);
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      });
  },

  onSignOut() {
    if (!this.ensureLogin()) return;
    checkoutActivity(this.data.activityId)
      .then(() => {
        wx.showToast({ title: t('common.hint.checkOutSuccess'), icon: 'success' });
        this.loadDetail(this.data.activityId);
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      });
  },
});
