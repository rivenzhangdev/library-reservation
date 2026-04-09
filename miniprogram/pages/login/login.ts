import { getLangClassName, t } from '../../utils/i18n';
import { getToken } from '../../utils/auth';

interface LoginPageData {
  currentLang: 'zh' | 'en';
  languageClass: string;
  pageTitle: string;
  brandTitle: string;
  brandSubtitle: string;
  description: string;
  buttonText: string;
  agreementText: string;
}

Page({
  data: {
    currentLang: 'zh',
    languageClass: 'lang-zh',
    pageTitle: '',
    brandTitle: '',
    brandSubtitle: '',
    description: '',
    buttonText: '',
    agreementText: '',
  } as LoginPageData,

  redirectUrl: '',

  onLoad(options: Record<string, string>) {
    this.redirectUrl = String(options?.redirectUrl || '');
    this.updateLanguage();
  },

  onShow() {
    this.updateLanguage();

    if (getToken()) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    const currentLang = app.globalData.currentLang || 'zh';
    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      pageTitle: t('login.pageTitle'),
      brandTitle: t('login.brandTitle'),
      brandSubtitle: t('login.brandSubtitle'),
      description: t('login.description'),
      buttonText: t('login.button'),
      agreementText: t('login.agreement'),
    });
  },

  onLoginTap() {
    const app = getApp<IAppOption>() as any;

    wx.getUserProfile({
      desc:
        this.data.currentLang === 'zh'
          ? '用于登录并同步用户头像和昵称'
          : 'Log in to sync your avatar and nickname',
      success: async (profileRes) => {
        try {
          await app.doWxLogin?.(profileRes.userInfo || {});
          wx.showToast({ title: t('login.success'), icon: 'success' });

          const nextUrl = this.redirectUrl || '/pages/index/index';
          if (this.redirectUrl) {
            wx.reLaunch({ url: nextUrl });
          } else {
            wx.switchTab({ url: nextUrl });
          }
        } catch (error) {
          console.error('Login failed:', error);
          wx.showToast({ title: t('login.failed'), icon: 'none' });
        }
      },
      fail: (error) => {
        console.error('User profile fetch failed:', error);
        wx.showToast({ title: t('login.failed'), icon: 'none' });
      },
    });
  },

  onAgreementTap() {
    wx.showToast({ title: t('login.agreementTip'), icon: 'none' });
  },

  onPrivacyTap() {
    wx.showToast({ title: t('login.privacyTip'), icon: 'none' });
  },
});
