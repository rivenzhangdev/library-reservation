import { getProfile, updateProfile } from '../../apis/user';
import { getLangClassName, t } from '../../utils/i18n';
import { getToken, setUserInfo } from '../../utils/auth';

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

interface MissingProfileFields {
  username: boolean;
  avatar: boolean;
}

function safeString(value: any): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getMissingProfileFields(user: any): MissingProfileFields {
  return {
    username: !safeString(user?.username),
    avatar: !safeString(user?.avatarUrl || user?.avatar),
  };
}

function getLoginUser(app: IAppOption, loginResult: any) {
  return loginResult?.userInfo || loginResult?.user || app.globalData.userInfo || {};
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

  getProfileSyncContentKey(missing: MissingProfileFields): string {
    if (missing.username && missing.avatar) return 'login.profileSync.contentBoth';
    if (missing.username) return 'login.profileSync.contentUsername';
    return 'login.profileSync.contentAvatar';
  },

  getProfileSyncDescKey(missing: MissingProfileFields): string {
    if (missing.username && missing.avatar) return 'login.profileSync.descBoth';
    if (missing.username) return 'login.profileSync.descUsername';
    return 'login.profileSync.descAvatar';
  },

  askProfileSyncConfirm(missing: MissingProfileFields): Promise<boolean> {
    return new Promise((resolve) => {
      wx.showModal({
        title: t('login.profileSync.title'),
        content: t(this.getProfileSyncContentKey(missing)),
        confirmText: t('common.btn.confirm'),
        cancelText: t('common.btn.cancel'),
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false),
      });
    });
  },

  requestWechatProfile(desc: string): Promise<any> {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc,
        success: resolve,
        fail: reject,
      });
    });
  },

  async refreshUserInfoFromServer() {
    const app = getApp<IAppOption>();
    try {
      const profileRes = await getProfile();
      const latestUser = (profileRes as any)?.data ?? profileRes;
      if (!latestUser || typeof latestUser !== 'object') {
        return;
      }

      const nextUserInfo = {
        ...(app.globalData.userInfo || {}),
        ...latestUser,
      };
      setUserInfo(nextUserInfo);
      app.globalData.userInfo = nextUserInfo;
    } catch (error) {
      console.error('Refresh profile failed:', error);
    }
  },

  async syncWechatProfileIfNeeded(loginResult: any) {
    const app = getApp<IAppOption>();
    const loginUser = getLoginUser(app, loginResult);
    const missing = getMissingProfileFields(loginUser);

    if (!missing.username && !missing.avatar) {
      return;
    }

    const shouldSync = await this.askProfileSyncConfirm(missing);
    if (!shouldSync) {
      return;
    }

    try {
      const desc = t(this.getProfileSyncDescKey(missing));
      const profileRes = await this.requestWechatProfile(desc);
      const wechatUserInfo = profileRes?.userInfo || {};
      const nickName = safeString(wechatUserInfo.nickName);
      const avatarUrl = safeString(wechatUserInfo.avatarUrl);

      const updateData: Record<string, any> = {};
      if (missing.username && nickName) {
        updateData.username = nickName;
        updateData.name = nickName;
      }
      if (missing.avatar && avatarUrl) {
        updateData.avatar = avatarUrl;
      }

      if (!Object.keys(updateData).length) {
        return;
      }

      await updateProfile(updateData);
      await this.refreshUserInfoFromServer();
    } catch (error) {
      console.error('Sync profile from WeChat failed:', error);
    }
  },

  navigateAfterLogin() {
    const nextUrl = this.redirectUrl || '/pages/index/index';
    if (this.redirectUrl) {
      wx.reLaunch({ url: nextUrl });
      return;
    }
    wx.switchTab({ url: nextUrl });
  },

  async onLoginTap() {
    const app = getApp<IAppOption>();
    if (!app.doWxLogin) {
      wx.showToast({ title: t('login.failed'), icon: 'none' });
      return;
    }

    try {
      const loginResult = await app.doWxLogin();
      await this.syncWechatProfileIfNeeded(loginResult);
      wx.showToast({ title: t('login.success'), icon: 'success' });
      this.navigateAfterLogin();
    } catch (error) {
      console.error('Login failed:', error);
      wx.showToast({ title: t('login.failed'), icon: 'none' });
    }
  },

  onAgreementTap() {
    wx.showToast({ title: t('login.agreementTip'), icon: 'none' });
  },

  onPrivacyTap() {
    wx.showToast({ title: t('login.privacyTip'), icon: 'none' });
  },
});
