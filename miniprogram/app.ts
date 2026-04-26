import i18n, { t, switchLanguage as switchLang, getLangClassName } from './utils/i18n';
import { clearAuthState, getToken, getUserInfo, setToken, setUserInfo } from './utils/auth';
import { checkLogin, wxLogin } from './apis/auth';
import { resetBackendEnvStorageOnLaunch } from './config/index';

function normalizeUserInfo(userInfo: any) {
  if (!userInfo) return undefined;

  const existing = getUserInfo() || {};
  const safeString = (value: any) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined;

  const avatarUrl = safeString(userInfo.avatarUrl) || safeString(existing.avatarUrl);
  const username = safeString(userInfo.username) || safeString(existing.username);
  const name = safeString(userInfo.name) || safeString(existing.name) || username;
  const nickName = safeString(userInfo.nickName) || safeString(userInfo.name) || username;
  const blacklisted =
    typeof userInfo.blacklisted === 'boolean'
      ? userInfo.blacklisted
      : typeof existing.blacklisted === 'boolean'
        ? existing.blacklisted
        : false;
  const blacklistReason =
    safeString(userInfo.blacklistReason) || safeString(existing.blacklistReason);
  const { avatar: _avatar1, ...existingRest } = existing;
  const { avatar: _avatar2, ...userInfoRest } = userInfo;

  return {
    ...existingRest,
    ...userInfoRest,
    id: userInfo.id || existing.id,
    name,
    nickName,
    avatarUrl,
    blacklisted,
    blacklistReason,
  };
}

const appConfig = {
  globalData: {
    userInfo: normalizeUserInfo(getUserInfo()),
    currentLang: 'zh' as 'zh' | 'en',
    langData: {},
    languageClass: 'lang-zh',
  },

  userInfoReadyCallback() {},

  onLaunch() {
    // 每次启动时重置并写入本次环境配置
    resetBackendEnvStorageOnLaunch();

    i18n.loadLanguage('zh');

    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    const token = getToken();
    if (!token) {
      return;
    }

    checkLogin()
      .then((res) => {
        const responseData = res.data as any;
        if (!responseData) return;

        const userInfo = normalizeUserInfo(responseData);
        setUserInfo(userInfo);
        this.globalData.userInfo = userInfo;
      })
      .catch(() => {
        clearAuthState();
        this.globalData.userInfo = undefined;
      });
  },

  onShow() {
    const token = getToken();
    if (!token) {
      this.globalData.userInfo = undefined;
      return;
    }
  },

  doWxLogin(userProfile: Record<string, any> = {}) {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (!res.code) {
            reject(new Error('Missing WeChat login code'));
            return;
          }

          wxLogin(res.code, userProfile)
            .then((loginRes) => {
              const responseData = loginRes.data as any;
              if (responseData) {
                const userInfo = normalizeUserInfo(responseData.userInfo || responseData.user);
                setToken(responseData.token);
                setUserInfo(userInfo);
                this.globalData.userInfo = userInfo;
              }
              resolve(responseData);
            })
            .catch((error) => {
              console.error('WeChat login failed:', error);
              reject(error);
            });
        },
        fail: reject,
      });
    });
  },

  customSwitchLanguage(lang: 'zh' | 'en') {
    switchLang(lang);

    const languageClass = `lang-${lang}`;
    this.globalData.languageClass = languageClass;

    const tabBarTexts = {
      zh: ['首页', '预约', '通知', '我的'],
      en: ['Home', 'Reserve', 'Notify', 'Profile'],
    };

    tabBarTexts[lang].forEach((text, index) => {
      wx.setTabBarItem({
        index,
        text,
        fail: (error) => {
          console.error('Set tabBar title failed:', error);
        },
      });
    });

    const pages = getCurrentPages();
    pages.forEach((page) => {
      if (page.setData) {
        page.setData({
          languageClass,
          currentLang: lang,
        });
      }
    });
  },

  t,
  switchLanguage: undefined,
  getLangClassName: undefined,
};

App<IAppOption>(appConfig);

const app = getApp<IAppOption>();
app.switchLanguage = app.customSwitchLanguage;
app.getLangClassName = getLangClassName;
