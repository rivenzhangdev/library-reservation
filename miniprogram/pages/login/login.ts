import config from '../../config/index';
import { clearLoginRedirectSuppression, getToken, markLoginPageDismissed } from '../../utils/auth';
import { getLangClassName, t } from '../../utils/i18n';

interface LoginPageData {
  currentLang: 'zh' | 'en';
  languageClass: string;
  pageTitle: string;
  brandTitle: string;
  brandSubtitle: string;
  description: string;
  buttonText: string;
  agreementText: string;
  showEnvSwitch: boolean;
  currentEnvLabel: string;
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
    showEnvSwitch: false,
    currentEnvLabel: '',
  } as LoginPageData,

  redirectUrl: '',
  loginCompleted: false,

  onLoad(options: Record<string, string>) {
    this.redirectUrl = String(options?.redirectUrl || '');
    this.loginCompleted = false;
    this.updateLanguage();
    this.updateEnvEntry();
  },

  onShow() {
    this.updateLanguage();
    this.updateEnvEntry();

    if (getToken()) {
      this.loginCompleted = true;
      this.navigateAfterLogin();
    }
  },

  onUnload() {
    if (this.loginCompleted || getToken()) {
      return;
    }

    // 用户主动关闭登录页后，短时间内不重复拉起。
    markLoginPageDismissed();
  },

  updateEnvEntry() {
    const showEnvSwitch = !config.isCurrentBackendEnvProd();
    const currentBase = config.getBaseUrl();
    const currentEnv = (config.BACKEND_ENVS as any[]).find((item) => item.baseUrl === currentBase);

    this.setData({
      showEnvSwitch,
      currentEnvLabel: currentEnv?.label || currentBase,
    });
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

  navigateAfterLogin() {
    if (this.redirectUrl) {
      wx.reLaunch({ url: this.redirectUrl });
      return;
    }

    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }

    wx.switchTab({ url: '/pages/index/index' });
  },

  async onLoginTap() {
    const app = getApp<IAppOption>();
    if (!app.doWxLogin) {
      wx.showToast({ title: t('common.auth.loginFailed'), icon: 'none' });
      return;
    }

    try {
      await app.doWxLogin();
      this.loginCompleted = true;
      clearLoginRedirectSuppression();
      wx.showToast({ title: t('common.auth.loginSuccess'), icon: 'success' });
      this.navigateAfterLogin();
    } catch (error) {
      console.error('Login failed:', error);
      wx.showToast({ title: t('common.auth.loginFailed'), icon: 'none' });
    }
  },

  onAgreementTap() {
    wx.navigateTo({ url: '/pages/agreement/agreement?type=agreement' });
  },

  onPrivacyTap() {
    wx.navigateTo({ url: '/pages/agreement/agreement?type=privacy' });
  },

  onEnvTap() {
    wx.navigateTo({ url: '/pages/settings-env/settings-env' });
  },
});
