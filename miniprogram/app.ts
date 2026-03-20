// app.ts
import i18n, { t, switchLanguage as switchLang, getLangClassName } from './utils/i18n';

// 定义 App 配置
const appConfig: IAppOption = {
  globalData: {
    currentLang: 'zh' as 'zh' | 'en',
    langData: {},
    languageClass: 'lang-zh', // 默认语言类名
  },

  userInfoReadyCallback: function () {
    // 用户信息准备就绪回调函数
  },

  onLaunch() {
    // 初始化多语言系统
    i18n.loadLanguage('zh');

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 登录
    wx.login({
      success: (res) => {
        console.log(res.code);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    });
  },

  // 自定义语言切换函数，更新全局语言类名
  customSwitchLanguage(lang: 'zh' | 'en') {
    switchLang(lang);

    // 更新全局语言类名
    const languageClass = `lang-${lang}`;
    this.globalData.languageClass = languageClass;

    // 更新 tabBar 标题
    const tabBarTexts = {
      zh: ['首页', '预约', '通知', '我的'],
      en: ['Home', 'Reserve', 'Notify', 'Profile'],
    };

    // 更新所有 tabBar 项的文本
    tabBarTexts[lang].forEach((text, index) => {
      wx.setTabBarItem({
        index,
        text,
        fail: (err) => {
          console.error('设置 tabBar 标题失败:', err);
        },
      });
    });

    // 通知所有页面更新语言类名和 currentLang
    const pages = getCurrentPages();
    pages.forEach((page) => {
      if (page.setData) {
        page.setData({
          languageClass: languageClass,
          currentLang: lang,
        });
      }
    });
  },

  // 暴露 t 函数和其他国际化相关函数供页面使用
  t,
  switchLanguage: undefined, // 会在 onLaunch 后被赋值
  getLangClassName: undefined, // 会在 onLaunch 后被赋值
};

// 创建 App 实例
App<IAppOption>(appConfig);

// 在 App 构造完成后更新方法引用
const app = getApp<IAppOption>();

// 将方法引用正确设置到 App 实例
app.switchLanguage = app.customSwitchLanguage;
app.getLangClassName = getLangClassName;
