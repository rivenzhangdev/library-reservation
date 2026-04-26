import { getMyBookings } from '../../apis/booking';
import { getCredit, getProfile } from '../../apis/user';
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
  titleIconName?: string;
  titleIconColor?: string;
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

  const avatarUrl = String(user.avatarUrl || user.avatar || '').trim();
  const { avatar: _avatar, ...rest } = user;
  return {
    ...rest,
    id: user.id,
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
          iconName: 'medal-o',
          iconColor: '#ca8a04',
          iconBgColor: '#fef9c3',
          action: 'onCreditCenterTap',
          disabled: !isLoggedIn,
        },
      ],
      serviceItems: [
        {
          label: t('common.quick.myReservation'),
          iconName: 'calendar-o',
          iconColor: '#2563eb',
          iconBgColor: '#dbeafe',
          action: 'onMyReservationTap',
          disabled: !isLoggedIn || !isStudentBound,
        },
        {
          label: t('common.quick.myRequests'),
          iconName: 'todo-list-o',
          iconColor: '#7c3aed',
          iconBgColor: '#f3e8ff',
          action: 'onMyRequestsTap',
          disabled: !isLoggedIn,
        },
        {
          label: t('common.quick.myCollection'),
          iconName: 'star',
          iconColor: '#f59e0b',
          iconBgColor: '#fef3c7',
          action: 'onMyCollectionTap',
          disabled: !isLoggedIn,
        },
      ],
      activityItems: [
        {
          label: t('common.quick.activityList'),
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
          disabled: false,
        },
        {
          label: t('profile.settings.help'),
          iconName: 'question-o',
          iconColor: '#ea580c',
          iconBgColor: '#ffedd5',
          action: 'onHelpTap',
          disabled: false,
        },
        {
          label: t('profile.settings.about'),
          iconName: 'info-o',
          iconColor: '#0891b2',
          iconBgColor: '#cffafe',
          action: 'onAboutTap',
          disabled: false,
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
      const bookingRes: any = await getMyBookings({ page: 1, pageSize: 1 });
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

  onMyRequestsTap() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: '/pages/my-requests/my-requests',
    });
  },

  onMyActivityTap() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: '/pages/activity-list/activity-list',
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
    wx.navigateTo({
      url: '/pages/notification-settings/notification-settings',
    });
  },

  onPrivacyTap() {
    wx.navigateTo({
      url: '/pages/agreement/agreement?type=privacy',
    });
  },

  onHelpTap() {
    wx.navigateTo({
      url: '/pages/help-center/help-center',
    });
  },

  onAboutTap() {
    wx.navigateTo({
      url: '/pages/about/about',
    });
  },
});
