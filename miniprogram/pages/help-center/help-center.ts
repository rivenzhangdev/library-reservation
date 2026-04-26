import { t } from '../../utils/i18n';

Page({
  data: {
    navTitle: '',
    pageIntro: '',
    sectionFaqTitle: '',
    sectionActionTitle: '',
    faqList: [] as Array<{ q: string; a: string }>,
    actionFeedback: '',
    actionAgreement: '',
    actionPrivacy: '',
  },

  onLoad() {
    this.setData({
      navTitle: t('profile.helpCenter.title'),
      pageIntro: t('profile.helpCenter.intro'),
      sectionFaqTitle: t('profile.helpCenter.faqTitle'),
      sectionActionTitle: t('profile.helpCenter.actionTitle'),
      faqList: [
        {
          q: t('profile.helpCenter.faq.reserve.q'),
          a: t('profile.helpCenter.faq.reserve.a'),
        },
        {
          q: t('profile.helpCenter.faq.change.q'),
          a: t('profile.helpCenter.faq.change.a'),
        },
        {
          q: t('profile.helpCenter.faq.violation.q'),
          a: t('profile.helpCenter.faq.violation.a'),
        },
      ],
      actionFeedback: t('profile.helpCenter.action.feedback'),
      actionAgreement: t('profile.helpCenter.action.agreement'),
      actionPrivacy: t('profile.helpCenter.action.privacy'),
    });
  },

  onFeedbackTap() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  onAgreementTap() {
    wx.navigateTo({ url: '/pages/agreement/agreement?type=agreement' });
  },

  onPrivacyTap() {
    wx.navigateTo({ url: '/pages/agreement/agreement?type=privacy' });
  },
});
