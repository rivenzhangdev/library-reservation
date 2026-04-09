import { getProfile } from '../../apis/user';
import { getUserInfo, isLogin, redirectToLogin, setUserInfo } from '../../utils/auth';
import { t } from '../../utils/i18n';

interface ProfileMenuItem {
  label: string;
  iconName: string;
  iconColor: string;
  iconBgColor: string;
  badgeCount?: number;
  clickable?: boolean;
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
  studentId: string;
  phone: string;
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
    studentId: '',
    phone: '',
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

  buildMenus() {
    return {
      serviceItems: [
        {
          label: t('profile.service.myReservation'),
          iconName: 'calendar-o',
          iconColor: '#2563eb',
          iconBgColor: '#dbeafe',
          badgeCount: 0,
          action: 'onMyReservationTap',
        },
        {
          label: t('profile.service.myCollection'),
          iconName: 'star-o',
          iconColor: '#d97706',
          iconBgColor: '#fef3c7',
          action: 'onMyCollectionTap',
        },
        {
          label: t('profile.service.myActivity'),
          iconName: 'todo-list-o',
          iconColor: '#dc2626',
          iconBgColor: '#fee2e2',
          action: 'onMyActivityTap',
        },
      ],
      centerItems: [
        {
          label: t('profile.center.personalInfo'),
          iconName: 'user-o',
          iconColor: '#7c3aed',
          iconBgColor: '#f3e8ff',
          action: 'onPersonalInfoTap',
        },
        {
          label: t('profile.center.creditCenter'),
          iconName: 'star',
          iconColor: '#ca8a04',
          iconBgColor: '#fef9c3',
          action: 'onCreditCenterTap',
        },
        {
          label: t('profile.center.feedback'),
          iconName: 'comment-o',
          iconColor: '#0284c7',
          iconBgColor: '#e0f2fe',
          action: 'onFeedbackTap',
        },
      ],
      settingsItems: [
        {
          label: t('profile.settings.notification'),
          iconName: 'bell',
          iconColor: '#2563eb',
          iconBgColor: '#dbeafe',
          action: 'onNotificationTap',
        },
        {
          label: t('profile.settings.privacy'),
          iconName: 'shield-o',
          iconColor: '#16a34a',
          iconBgColor: '#dcfce7',
          action: 'onPrivacyTap',
        },
        {
          label: t('profile.settings.help'),
          iconName: 'question-o',
          iconColor: '#ea580c',
          iconBgColor: '#ffedd5',
          action: 'onHelpTap',
        },
        {
          label: t('profile.settings.about'),
          iconName: 'info-o',
          iconColor: '#0891b2',
          iconBgColor: '#cffafe',
          action: 'onAboutTap',
        },
      ],
    };
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    const currentLang = app.globalData.currentLang || 'zh';
    const isZh = currentLang === 'zh';
    const { serviceItems, centerItems, settingsItems } = this.buildMenus();

    this.setData({
      currentLang,
      pageTitle: t('profile.pageTitle'),
      sectionTitle: t('profile.sectionTitle'),
      centerTitle: t('profile.centerTitle'),
      settingsTitle: t('profile.settingsTitle'),
      langSwitchLabel: isZh ? t('common.lang.en') : t('common.lang.zh'),
      langSwitchDesc: isZh ? 'Switch to English' : '切换到中文',
      userAccountLabel: t('profile.user.wechatAccount'),
      loginTip: t('profile.login.tip'),
      loginActionText: t('profile.login.action'),
      serviceItems,
      centerItems,
      settingsItems,
    });
  },

  applyUserState(user: any) {
    const normalized = normalizeUser(user);
    if (!normalized) return;

    this.setData({
      isLoggedIn: true,
      userName: getDisplayName(normalized),
      userAccount: normalized.username || normalized.nickName || '',
      avatarUrl: normalized.avatarUrl || '',
      studentId: normalized.studentId || t('profile.user.unbound'),
      phone: normalized.phone || t('profile.user.unbound'),
    });
  },

  loadUserProfile() {
    if (!isLogin()) {
      this.setData({
        isLoggedIn: false,
        userName: t('profile.user.guest'),
        userAccount: '',
        avatarUrl: '',
        studentId: t('profile.user.unbound'),
        phone: t('profile.user.unbound'),
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
