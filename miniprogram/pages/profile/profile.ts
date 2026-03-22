import { t } from '../../utils/i18n';

interface IProfileData {
  currentLang: string;
  pageTitle: string;
  sectionTitle: string;
  centerTitle: string;
  settingsTitle: string;
  userName: string;
  studentId: string;
  phone: string;
  creditScore: string;
  balance: string;
  serviceItems: any[];
  centerItems: any[];
  settingsItems: any[];
  langSwitchLabel: string;
  langSwitchDesc: string;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentLang: 'zh',
    // 多语言文案 - 初始值设为空字符串，在 onLoad 中初始化
    pageTitle: '',
    sectionTitle: '',
    centerTitle: '',
    settingsTitle: '',
    // 用户信息
    userName: '',
    studentId: '',
    phone: '',
    creditScore: '',
    balance: '',
    // 我的服务模块数据
    serviceItems: [],
    // 个人中心模块数据
    centerItems: [],
    // 系统设置模块数据
    settingsItems: [],
    // 语言切换按钮文案
    langSwitchLabel: '',
    langSwitchDesc: '切换到英文',
  } as IProfileData,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.initPageData();
    this.updateLanguage();
  },

  /**
   * 初始化页面数据
   */
  initPageData() {
    this.setData({
      pageTitle: t('profile.pageTitle'),
      sectionTitle: t('profile.sectionTitle'),
      centerTitle: t('profile.centerTitle'),
      settingsTitle: t('profile.settingsTitle'),
      userName: t('profile.user.name'),
      studentId: t('profile.user.studentId'),
      phone: t('profile.user.phone'),
      creditScore: t('profile.user.creditScore'),
      balance: t('profile.user.balance'),
      langSwitchLabel: t('common.lang.en'),
      // 我的服务模块
      serviceItems: [
        {
          label: t('profile.service.myReservation'),
          iconName: 'calendar-o',
          iconColor: '#409eff',
          iconBgColor: '#e8f4ff',
          badgeCount: 2,
          action: 'onMyReservationTap',
        },
        {
          label: t('profile.service.myCollection'),
          iconName: 'star-o',
          iconColor: '#e6a23c',
          iconBgColor: '#fff0f0',
          action: 'onMyCollectionTap',
        },
        {
          label: t('profile.service.myActivity'),
          iconName: 'todo-list-o',
          iconColor: '#e74c3c',
          iconBgColor: '#fff7e8',
          badgeCount: 1,
          action: 'onMyActivityTap',
        },
      ],
      // 个人中心模块
      centerItems: [
        {
          label: t('profile.center.personalInfo'),
          iconName: 'user-o',
          iconColor: '#722ed1',
          iconBgColor: '#f9f0ff',
          action: 'onPersonalInfoTap',
        },
        {
          label: t('profile.center.creditCenter'),
          iconName: 'star',
          iconColor: '#faad14',
          iconBgColor: '#fff7e6',
          action: 'onCreditCenterTap',
        },
        {
          label: t('profile.center.feedback'),
          iconName: 'comment-o',
          iconColor: '#1890ff',
          iconBgColor: '#e6f7ff',
          badgeCount: 1,
          action: 'onFeedbackTap',
        },
      ],
      // 系统设置模块
      settingsItems: [
        {
          label: t('profile.settings.notification'),
          iconName: 'bell',
          iconColor: '#1890ff',
          iconBgColor: '#e6f7ff',
          action: 'onNotificationTap',
        },
        {
          label: t('profile.settings.privacy'),
          iconName: 'shield-o',
          iconColor: '#52c41a',
          iconBgColor: '#f6ffed',
          action: 'onPrivacyTap',
        },
        {
          label: t('profile.settings.help'),
          iconName: 'question-o',
          iconColor: '#fa8c16',
          iconBgColor: '#fff7e6',
          action: 'onHelpTap',
        },
        {
          label: t('profile.settings.about'),
          iconName: 'info-o',
          iconColor: '#13c2c2',
          iconBgColor: '#e6fffb',
          action: 'onAboutTap',
        },
      ],
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.updateLanguage();
  },

  /**
   * 更新页面语言
   */
  updateLanguage() {
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      const currentLang = app.globalData.currentLang || 'zh';
      const isZh = currentLang === 'zh';

      this.setData({
        currentLang,
        pageTitle: t('profile.pageTitle'),
        sectionTitle: t('profile.sectionTitle'),
        centerTitle: t('profile.centerTitle'),
        settingsTitle: t('profile.settingsTitle'),
        userName: t('profile.user.name'),
        studentId: t('profile.user.studentId'),
        phone: t('profile.user.phone'),
        creditScore: t('profile.user.creditScore'),
        balance: t('profile.user.balance'),
        langSwitchLabel: isZh ? t('common.lang.en') : t('common.lang.zh'),
        langSwitchDesc: isZh ? '切换到英文' : 'Switch to Chinese',
        // 我的服务模块
        serviceItems: [
          {
            label: t('profile.service.myReservation'),
            iconName: 'calendar-o',
            iconColor: '#409eff',
            iconBgColor: '#e8f4ff',
            badgeCount: 2,
            clickable: true,
            action: 'onMyReservationTap',
          },
          {
            label: t('profile.service.myCollection'),
            iconName: 'star-o',
            iconColor: '#e6a23c',
            iconBgColor: '#fff0f0',
            clickable: true,
            action: 'onMyCollectionTap',
          },
          {
            label: t('profile.service.myActivity'),
            iconName: 'todo-list-o',
            iconColor: '#e74c3c',
            iconBgColor: '#fff7e8',
            badgeCount: 1,
            clickable: true,
            action: 'onMyActivityTap',
          },
        ],
        // 个人中心模块
        centerItems: [
          {
            label: t('profile.center.personalInfo'),
            iconName: 'user-o',
            iconColor: '#722ed1',
            iconBgColor: '#f9f0ff',
            clickable: true,
            action: 'onPersonalInfoTap',
          },
          {
            label: t('profile.center.creditCenter'),
            iconName: 'star',
            iconColor: '#faad14',
            iconBgColor: '#fff7e6',
            clickable: true,
            action: 'onCreditCenterTap',
          },
          {
            label: t('profile.center.feedback'),
            iconName: 'comment-o',
            iconColor: '#1890ff',
            iconBgColor: '#e6f7ff',
            badgeCount: 1,
            clickable: true,
            action: 'onFeedbackTap',
          },
        ],
        // 系统设置模块
        settingsItems: [
          {
            label: t('profile.settings.notification'),
            iconName: 'bell',
            iconColor: '#1890ff',
            iconBgColor: '#e6f7ff',
            clickable: true,
            action: 'onNotificationTap',
          },
          {
            label: t('profile.settings.privacy'),
            iconName: 'shield-o',
            iconColor: '#52c414a',
            iconBgColor: '#f6ffed',
            clickable: true,
            action: 'onPrivacyTap',
          },
          {
            label: t('profile.settings.help'),
            iconName: 'question-o',
            iconColor: '#fa8c16',
            iconBgColor: '#fff7e6',
            clickable: true,
            action: 'onHelpTap',
          },
          {
            label: t('profile.settings.about'),
            iconName: 'info-o',
            iconColor: '#13c2c2',
            iconBgColor: '#e6fffb',
            clickable: true,
            action: 'onAboutTap',
          },
        ],
      });
    }
  },

  /**
   * 处理模块项点击
   */
  onSectionItemTap(event: WechatMiniprogram.CustomEvent) {
    const { action } = event.detail;

    // 如果没有 action，直接返回
    if (!action) {
      return;
    }

    // 动态调用对应的方法
    const method = (this as any)[action];
    if (typeof method === 'function') {
      method();
    }
  },

  /**
   * 切换到语言设置
   */
  onLanguageSwitch() {
    const app = getApp<IAppOption>();
    if (app && app.switchLanguage) {
      const currentLang = app.globalData.currentLang || 'zh';
      const newLang = currentLang === 'zh' ? 'en' : 'zh';
      app.switchLanguage(newLang);
    }
  },

  /**
   * 跳转到个人信息
   */
  onPersonalInfoTap() {
    // TODO: 跳转到个人信息页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },

  /**
   * 跳转到我的预约
   */
  onMyReservationTap() {
    wx.navigateTo({
      url: '/pages/my-reservation/my-reservation',
    });
  },

  /**
   * 跳转到我的收藏
   */
  onMyCollectionTap() {
    wx.navigateTo({
      url: '/pages/my-collection/my-collection',
    });
  },

  /**
   * 跳转到我的活动
   */
  onMyActivityTap() {
    wx.navigateTo({
      url: '/pages/my-activity/my-activity',
      success: () => {},
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showModal({
          title: '提示',
          content: '页面跳转失败，请重试',
          showCancel: false,
        });
      },
    });
  },

  /**
   * 跳转到预约历史
   */
  onHistoryTap() {
    // TODO: 跳转到历史页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },

  /**
   * 跳转到设置
   */
  onSettingsTap() {
    // TODO: 跳转到设置页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },

  /**
   * 跳转到信用中心
   */
  onCreditCenterTap() {
    // TODO: 跳转到信用中心页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },

  /**
   * 跳转到问题反馈
   */
  onFeedbackTap() {
    wx.navigateTo({
      url: '/pages/feedback/feedback',
      success: () => {
        wx.showToast({
          title: '打开问题反馈',
          icon: 'none',
          duration: 1500,
        });
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showModal({
          title: '提示',
          content: '页面跳转失败，请重试',
          showCancel: false,
        });
      },
    });
  },

  /**
   * 跳转到关于我们
   */
  onAboutTap() {
    // TODO: 跳转到关于我们页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },

  /**
   * 跳转到帮助中心
   */
  onHelpTap() {
    // TODO: 跳转到帮助中心页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },

  /**
   * 跳转到隐私设置
   */
  onPrivacyTap() {
    // TODO: 跳转到隐私设置页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },

  /**
   * 跳转到通知设置
   */
  onNotificationTap() {
    // TODO: 跳转到通知设置页面
    wx.showToast({
      title: '敬请期待',
      icon: 'none',
    });
  },
});
