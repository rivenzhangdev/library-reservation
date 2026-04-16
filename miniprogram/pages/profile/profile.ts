import { getCredit, getProfile } from '../../apis/user';
import { getMyBookings } from '../../apis/booking';
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
  centerTitle: string;
  serviceTitle: string;
  activityTitle: string;
  settingsTitle: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isStudentBound: boolean;
  centerItems: ProfileMenuItem[];
  serviceItems: ProfileMenuItem[];
  activityItems: ProfileMenuItem[];
  settingsItems: ProfileMenuItem[];
  langSwitchLabel: string;
  langSwitchDesc: string;
  subtitleLoggedIn: string;
  subtitleGuest: string;
  userName: string;
  userRole: string;
  userStudentIdLabel: string;
  userStudentId: string;
  profileCompletionText: string;
  creditScoreLabel: string;
  creditScore: string | number;
  bookingCountLabel: string;
  bookingCount: string | number;
  avatarUrl: string;
  loginTip: string;
  loginActionText: string;
}

function normalizeUser(user: any) {
  if (!user) return null;

  const avatarUrl = String(user.avatarUrl || '').trim();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { avatar: _avatar, ...rest } = user;
  return {
    ...rest,
    id: user.id || user._id,
    username: user.username || '',
    nickName: user.nickName || user.name || '',
    name: user.name || user.nickName || '',
    avatarUrl,
    studentId: user.studentId || '',
    phone: user.phone || '',
    updatedAt: user.updatedAt || user.updated_at || user.updatedAt || '',
  };
}

function maskStudentId(studentId: string) {
  const trimmed = String(studentId || '').trim();
  if (!trimmed || trimmed.length < 6) return trimmed.replace(/.(?=.$)/g, '*');
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-2);
  return `${prefix}${'*'.repeat(Math.max(trimmed.length - 6, 4))}${suffix}`;
}

function getDisplayName(user: any) {
  if (!user) return t('profile.user.guest');

  const preferredName = user.username || user.nickName || user.name || '';
  return preferredName || t('profile.user.guest');
}

Page({
  data: {
    currentLang: 'zh',
    pageTitle: '',
    centerTitle: '',
    serviceTitle: '',
    activityTitle: '',
    settingsTitle: '',
    isLoggedIn: false,
    isStudentBound: false,
    centerItems: [],
    serviceItems: [],
    activityItems: [],
    settingsItems: [],
    langSwitchLabel: '',
    langSwitchDesc: '',
    userName: t('profile.user.guest'),
    isAdmin: false,
    userRole: t('profile.user.guestRole'),
    userStudentIdLabel: t('profile.user.studentId'),
    userStudentId: '-',
    profileCompletionText: '',
    subtitleLoggedIn: t('profile.status.subtitle.loggedIn'),
    subtitleGuest: t('profile.status.subtitle.guest'),
    creditScoreLabel: t('common.field.creditScore'),
    creditScore: '-',
    bookingCountLabel: t('profile.user.bookingCount'),
    bookingCount: '0',
    avatarUrl: '',
    loginTip: t('profile.login.tip'),
    loginActionText: t('profile.login.action'),
  } as ProfilePageData,

  onLoad() {
    this.updateLanguage();
    this.loadUserProfile();
  },

  onShow() {
    this.updateLanguage();
    this.loadUserProfile();
  },

  buildMenus(isLoggedIn: boolean, isStudentBound: boolean) {
    return {
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
          iconName: 'trophy',
          iconColor: '#ca8a04',
          iconBgColor: '#fef9c3',
          action: 'onCreditCenterTap',
          disabled: !isLoggedIn,
        },
      ],
      serviceItems: [
        {
          label: t('profile.service.myReservation'),
          iconName: 'calendar-o',
          iconColor: '#2563eb',
          iconBgColor: '#dbeafe',
          action: 'onMyReservationTap',
          disabled: !isLoggedIn || !isStudentBound,
        },
        {
          label: t('profile.service.myCollection'),
          iconName: 'star',
          iconColor: '#f59e0b',
          iconBgColor: '#fef3c7',
          action: 'onMyCollectionTap',
          disabled: !isLoggedIn,
        },
      ],
      activityItems: [
        {
          label: t('profile.service.activityList'),
          iconName: 'service',
          iconColor: '#10b981',
          iconBgColor: '#dcfce7',
          action: 'onMyActivityTap',
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
    const { centerItems, serviceItems, activityItems, settingsItems } = this.buildMenus(
      isLoggedIn,
      isStudentBound
    );

    this.setData({
      currentLang,
      pageTitle: t('profile.pageTitle'),
      centerTitle: t('profile.centerTitle'),
      serviceTitle: t('profile.serviceTitle'),
      activityTitle: t('profile.activityTitle'),
      settingsTitle: t('profile.settingsTitle'),
      langSwitchLabel: isZh ? t('common.lang.en') : t('common.lang.zh'),
      langSwitchDesc: isZh ? t('common.lang.en') : t('common.lang.zh'),
      centerItems,
      serviceItems,
      activityItems,
      settingsItems,
      userName: t('profile.user.guest'),
      isAdmin: false,
      userRole: t('profile.user.guestRole'),
      userStudentIdLabel: t('profile.user.studentId'),
      userStudentId: '-',
      profileCompletionText: '',
      subtitleLoggedIn: t('profile.status.subtitle.loggedIn'),
      subtitleGuest: t('profile.status.subtitle.guest'),
      creditScoreLabel: t('common.field.creditScore'),
      creditScore: '-',
      bookingCountLabel: t('profile.user.bookingCount'),
      bookingCount: '0',
      avatarUrl: '',
      loginTip: t('profile.login.tip'),
      loginActionText: t('profile.login.action'),
    });
  },

  applyUserState(user: any) {
    const normalized = normalizeUser(user);
    if (!normalized) return;

    const bound = hasBoundStudentInfo(normalized);
    const menuState = this.buildMenus(true, bound);
    const fields = [normalized.name, normalized.studentId, normalized.phone, normalized.avatarUrl];
    const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);
    const completionText =
      completion < 100
        ? `${t('profile.user.profileCompletion')} ${completion}%`
        : t('profile.user.profileCompletionFull');

    this.setData({
      isLoggedIn: true,
      isAdmin: normalized.role === 1,
      isStudentBound: bound,
      userName: getDisplayName(normalized),
      userRole: normalized.role === 1 ? t('profile.role.admin') : '',
      userStudentIdLabel: t('profile.user.studentId'),
      userStudentId: normalized.studentId ? maskStudentId(normalized.studentId) : '-',
      profileCompletionText: completionText,
      creditScoreLabel: t('common.field.creditScore'),
      bookingCountLabel: t('profile.user.bookingCount'),
      avatarUrl: normalized.avatarUrl || '',
      centerItems: menuState.centerItems,
      serviceItems: menuState.serviceItems,
      activityItems: menuState.activityItems,
      settingsItems: menuState.settingsItems,
    });
    this.loadUserMetrics();
  },

  loadUserProfile() {
    if (!isLogin()) {
      const menuState = this.buildMenus(false, false);
      this.setData({
        isLoggedIn: false,
        isStudentBound: false,
        userName: t('profile.user.guest'),
        userRole: t('profile.user.guestRole'),
        creditScoreLabel: t('common.field.creditScore'),
        creditScore: '-',
        bookingCountLabel: t('profile.user.bookingCount'),
        bookingCount: '0',
        avatarUrl: '',
        centerItems: menuState.centerItems,
        serviceItems: menuState.serviceItems,
        activityItems: menuState.activityItems,
        settingsItems: menuState.settingsItems,
      });
      return;
    }

    const cachedUser = normalizeUser(getUserInfo());
    if (cachedUser) {
      this.applyUserState(cachedUser);
    }

    getProfile()
      .then((res) => {
        const payload = res?.data ?? res;
        const user = normalizeUser(payload);
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

  async loadUserMetrics() {
    if (!isLogin()) return;

    try {
      const creditRes: any = await getCredit();
      const summary = creditRes?.data ?? creditRes;
      const score = Number(summary.creditScore ?? summary.score ?? 0);
      this.setData({
        creditScore: Number.isFinite(score) ? score : '-',
      });
    } catch {
      this.setData({ creditScore: '-' });
    }

    try {
      const bookingRes: any = await getMyBookings({ page: 1, limit: 1 });
      const total = bookingRes?.data?.total ?? 0;
      this.setData({ bookingCount: total });
    } catch {
      this.setData({ bookingCount: 0 });
    }
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
