import { getProfile } from '../../apis/user';
import {
  getUserInfo,
  hasBoundStudentInfo,
  isLogin,
  redirectToLogin,
  setUserInfo,
} from '../../utils/auth';
import { t } from '../../utils/i18n';

interface ProfileMenuItem {
  label: string;
  iconName: string;
  iconColor: string;
  iconBgColor: string;
  badgeCount?: number;
  clickable?: boolean;
  disabled?: boolean;
  action: string;
}

interface ProfilePageData {
  currentLang: 'zh' | 'en';
  pageTitle: string;
  sectionTitle: string;
  centerTitle: string;
  settingsTitle: string;
  isLoggedIn: boolean;
  userName: string;
  userAccountLabel: string;
  userAccount: string;
  forgotPasswordText: string;
  isStudentBound: boolean;
  serviceNotice: string;
  serviceItems: ProfileMenuItem[];
  centerItems: ProfileMenuItem[];
  settingsItems: ProfileMenuItem[];
  langSwitchLabel: string;
  langSwitchDesc: string;
  loginTip: string;
  loginActionText: string;
  avatarUrl?: string;
}

function normalizeUser(user: any) {
  if (!user) return null;

  return {
    ...user,
    id: user.id || user._id,
    username: user.username || '',
    nickName: user.nickName || user.name || '',
    name: user.name || user.nickName || user.username || '',
    avatar: user.avatar || user.avatarUrl || '',
    avatarUrl: user.avatarUrl || user.avatar || '',
    studentId: user.studentId || '',
    phone: user.phone || '',
  };
}

function getDisplayName(user: any) {
  if (!user) return t('profile.user.guest');

  const studentId = String(user.studentId || '').trim();
  const preferredName = user.nickName || user.name || '';

  if (!studentId) {
    return preferredName || user.username || t('profile.user.guest');
  }

  return preferredName || user.username || t('profile.user.guest');
}

Page({
  data: {
    currentLang: 'zh',
    pageTitle: '',
    sectionTitle: '',
    centerTitle: '',
    settingsTitle: '',
    isLoggedIn: false,
    userName: '',
    userAccountLabel: '',
    userAccount: '',
    avatarUrl: '',
    forgotPasswordText: '',
    isStudentBound: false,
    serviceNotice: '',
    serviceItems: [],
    centerItems: [],
    settingsItems: [],
    langSwitchLabel: '',
    langSwitchDesc: '',
    loginTip: '',
    loginActionText: '',
  } as ProfilePageData,

  onLoad() {
    this.updateLanguage();
    this.loadUserProfile();
  },

  onShow() {
    this.updateLanguage();
    this.loadUserProfile();
  },

  getServiceNotice(isLoggedIn: boolean, isStudentBound: boolean) {
    if (!isLoggedIn) {
      return t('profile.service.tip.loggedOut');
    }
    if (!isStudentBound) {
      return t('profile.service.tip.unbound');
    }
    return t('profile.service.tip.bound');
  },

  buildMenus(isLoggedIn: boolean, isStudentBound: boolean) {
    return {
      serviceItems: [
        {
          label: t('profile.service.myReservation'),
          iconName: 'calendar-o',
          iconColor: '#2563eb',
          iconBgColor: '#dbeafe',
          badgeCount: 0,
          action: 'onMyReservationTap',
          disabled: !isLoggedIn || !isStudentBound,
        },
        {
          label: t('profile.service.myCollection'),
          iconName: 'star-o',
          iconColor: '#d97706',
          iconBgColor: '#fef3c7',
          action: 'onMyCollectionTap',
          disabled: !isLoggedIn,
        },
        {
          label: t('profile.service.myActivity'),
          iconName: 'todo-list-o',
          iconColor: '#dc2626',
          iconBgColor: '#fee2e2',
          action: 'onMyActivityTap',
          disabled: !isLoggedIn,
        },
      ],
      centerItems: [
        {
          label: t('profile.center.personalInfo'),
          iconName: 'user-o',
          iconColor: '#7c3aed',
          iconBgColor: '#f3e8ff',
          action: 'onPersonalInfoTap',
          disabled: !isLoggedIn,
        },
        {
          label: t('profile.center.creditCenter'),
          iconName: 'star',
          iconColor: '#ca8a04',
          iconBgColor: '#fef9c3',
          action: 'onCreditCenterTap',
          disabled: !isLoggedIn,
        },
        {
          label: t('profile.center.feedback'),
          iconName: 'comment-o',
          iconColor: '#0284c7',
          iconBgColor: '#e0f2fe',
          action: 'onFeedbackTap',
          disabled: !isLoggedIn,
        },
      ],
      settingsItems: [
        {
          label: t('profile.settings.notification'),
          iconName: 'bell',
          iconColor: '#2563eb',
          iconBgColor: '#dbeafe',
          action: 'onNotificationTap',
          disabled: !isLoggedIn,
        },
        {
          label: t('profile.settings.privacy'),
          iconName: 'shield-o',
          iconColor: '#16a34a',
          iconBgColor: '#dcfce7',
          action: 'onPrivacyTap',
          disabled: !isLoggedIn,
        },
        {
          label: t('profile.settings.help'),
          iconName: 'question-o',
          iconColor: '#ea580c',
          iconBgColor: '#ffedd5',
          action: 'onHelpTap',
          disabled: !isLoggedIn,
        },
        {
          label: t('profile.settings.about'),
          iconName: 'info-o',
          iconColor: '#0891b2',
          iconBgColor: '#cffafe',
          action: 'onAboutTap',
          disabled: !isLoggedIn,
        },
      ],
    };
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    const currentLang = app.globalData.currentLang || 'zh';
    const isZh = currentLang === 'zh';
    const isLoggedIn = isLogin();
    const isStudentBound = isLoggedIn && hasBoundStudentInfo();
    const { serviceItems, centerItems, settingsItems } = this.buildMenus(
      isLoggedIn,
      isStudentBound
    );

    this.setData({
      currentLang,
      pageTitle: t('profile.pageTitle'),
      sectionTitle: t('profile.sectionTitle'),
      centerTitle: t('profile.centerTitle'),
      settingsTitle: t('profile.settingsTitle'),
      forgotPasswordText: t('profile.bindCard.forgetPassword'),
      langSwitchLabel: isZh ? t('common.lang.en') : t('common.lang.zh'),
      langSwitchDesc: isZh ? 'Switch to English' : '切换到中文',
      userAccountLabel: t('profile.user.wechatAccount'),
      loginTip: t('profile.login.tip'),
      loginActionText: t('profile.login.action'),
      serviceItems,
      centerItems,
      settingsItems,
      serviceNotice: this.getServiceNotice(isLoggedIn, isStudentBound),
    });
  },

  applyUserState(user: any) {
    const normalized = normalizeUser(user);
    if (!normalized) return;

    const bound = hasBoundStudentInfo(normalized);
    const serviceState = this.buildMenus(true, bound);
    this.setData({
      isLoggedIn: true,
      isStudentBound: bound,
      userName: getDisplayName(normalized),
      userAccount: normalized.username || normalized.nickName || '',
      avatarUrl: normalized.avatarUrl || '',
      serviceItems: serviceState.serviceItems,
      centerItems: serviceState.centerItems,
      settingsItems: serviceState.settingsItems,
      serviceNotice: this.getServiceNotice(true, bound),
    });
  },

  loadUserProfile() {
    if (!isLogin()) {
      const serviceState = this.buildMenus(false, false);
      this.setData({
        isLoggedIn: false,
        isStudentBound: false,
        userName: t('profile.user.guest'),
        userAccount: '',
        avatarUrl: '',
        serviceItems: serviceState.serviceItems,
        centerItems: serviceState.centerItems,
        settingsItems: serviceState.settingsItems,
        serviceNotice: this.getServiceNotice(false, false),
      });
      return;
    }

    const cachedUser = normalizeUser(getUserInfo());
    if (cachedUser) {
      this.applyUserState(cachedUser);
    }

    getProfile()
      .then((res) => {
        const user = normalizeUser(res.data);
        if (!user) return;

        const nextUserInfo = {
          ...(getUserInfo() || {}),
          ...user,
        };
        setUserInfo(nextUserInfo);
        this.applyUserState(nextUserInfo);
      })
      .catch(() => {});
  },

  onLoginTap() {
    redirectToLogin();
  },

  onForgotPasswordTap() {
    const content =
      this.data.currentLang === 'zh'
        ? '当前小程序使用微信登录，仅支持通过微信账号恢复。若需要密码重置，请联系管理员或使用后台账号管理。'
        : 'This mini program uses WeChat login and does not support password reset in-app. Please contact the administrator or use admin account management if needed.';

    wx.showModal({
      title: this.data.forgotPasswordText,
      content,
      showCancel: false,
    });
  },

  onSectionItemTap(event: WechatMiniprogram.CustomEvent) {
    const { action } = event.detail;
    const method = (this as any)[action];
    if (typeof method === 'function') {
      method();
    }
  },

  onLanguageSwitch() {
    const app = getApp<IAppOption>();
    if (!app.switchLanguage) return;

    const nextLang = app.globalData.currentLang === 'zh' ? 'en' : 'zh';
    app.switchLanguage(nextLang);
  },

  ensureLoggedIn() {
    if (isLogin()) return true;
    redirectToLogin();
    return false;
  },

  onPersonalInfoTap() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: '/pages/personal-info/personal-info',
    });
  },

  onMyReservationTap() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: '/pages/my-reservation/my-reservation',
    });
  },

  onMyCollectionTap() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: '/pages/my-collection/my-collection',
    });
  },

  onMyActivityTap() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: '/pages/my-activity/my-activity',
    });
  },

  onCreditCenterTap() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: '/pages/credit/credit',
    });
  },

  onFeedbackTap() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: '/pages/feedback/feedback',
    });
  },

  onNotificationTap() {
    if (!this.ensureLoggedIn()) return;
    wx.switchTab({
      url: '/pages/notification/notification',
    });
  },

  onPrivacyTap() {
    const content =
      this.data.currentLang === 'zh'
        ? '我们仅收集预约、通知所需的必要资料，不会向无关第三方共享你的个人信息。'
        : 'We only use the minimum profile information required for reservations and notifications.';

    wx.showModal({
      title: t('profile.settings.privacy'),
      content,
      showCancel: false,
    });
  },

  onHelpTap() {
    const content =
      this.data.currentLang === 'zh'
        ? '可在“预约”页选择日期、时段与座位完成预约；相关问题也可以通过反馈页提交。'
        : 'Use the reservation page to choose date, time period and seat. You can also submit feedback if you need help.';

    wx.showModal({
      title: t('profile.settings.help'),
      content,
      showCancel: false,
    });
  },

  onAboutTap() {
    const content =
      this.data.currentLang === 'zh'
        ? '图书馆座位预约系统 v1.0.0\n\n提供座位查询、预约、活动和通知等能力。'
        : 'Library Reservation v1.0.0\n\nProvides seat search, reservation, activity and notification features.';

    wx.showModal({
      title: t('profile.settings.about'),
      content,
      showCancel: false,
    });
  },
});
