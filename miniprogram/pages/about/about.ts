import { t } from '../../utils/i18n';

Page({
  data: {
    navTitle: '',
    appName: '',
    appDesc: '',
    versionLabel: '',
    versionValue: '-',
    envLabel: '',
    envValue: '-',
    actionAgreement: '',
    actionPrivacy: '',
    actionFeedback: '',
  },

  onLoad() {
    const account = wx.getAccountInfoSync?.();
    const version = String(account?.miniProgram?.version || '-');
    const envVersion = String(account?.miniProgram?.envVersion || '-');

    this.setData({
      navTitle: t('profile.about.title'),
      appName: t('profile.about.appName'),
      appDesc: t('profile.about.appDesc'),
      versionLabel: t('profile.about.version'),
      versionValue: version,
      envLabel: t('profile.about.environment'),
      envValue: envVersion,
      actionAgreement: t('profile.about.action.agreement'),
      actionPrivacy: t('profile.about.action.privacy'),
      actionFeedback: t('profile.about.action.feedback'),
    });
  },

  onAgreementTap() {
    wx.navigateTo({ url: '/pages/agreement/agreement?type=agreement' });
  },

  onPrivacyTap() {
    wx.navigateTo({ url: '/pages/agreement/agreement?type=privacy' });
  },

  onFeedbackTap() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },
});
