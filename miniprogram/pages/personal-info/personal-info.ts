import * as authApi from '../../apis/auth';
import { getProfile, updateProfile, getCredit } from '../../apis/user';
import { getMyBookings } from '../../apis/booking';
import { getUserInfo, isLogin, redirectToLogin, setUserInfo } from '../../utils/auth';
import { formatDateTime } from '../../utils/time';
import { readLocalImageAsDataUrl } from '../../utils/file';
import { t } from '../../utils/i18n';

function normalizeUser(user: any) {
  if (!user) return null;

  const studentId = String(user.studentId || '').trim();
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
    studentId,
    phone: user.phone || '',
    createdAt: user.createdAt || user.created_at || user.createdAt || '',
    isAdmin: user.role === 1,
    isStudentBound: !!studentId,
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
  if (!user) return '';
  return user.username || user.nickName || user.name || '';
}

Page({
  data: {
    navTitle: '',
    languageClass: 'lang-zh',
    subtitle: '',
    nameLabel: '',
    usernameLabel: '',
    usernamePlaceholder: '',
    phoneLabel: '',
    phonePlaceholder: '',
    phoneBoundLabel: '',
    phoneUnboundLabel: '',
    studentIdLabel: '',
    studentIdPlaceholder: '',
    registerDateLabel: '',
    creditScoreLabel: '',
    bookingCountLabel: '',
    bindStudentIdText: '',
    requestChangeText: '',
    requestChangeHint: '',
    modifyAvatarText: '',
    saveProfileText: '',
    userName: '',
    usernameField: '',
    phoneField: '',
    phoneBound: false,
    phoneChangeHint: '',
    phoneChangeText: '',
    userRole: '',
    studentId: '',
    studentIdStatusText: '',
    creditScore: '-' as string | number,
    registerDate: '',
    bookingCount: '0' as string | number,
    avatarUrl: '',
    isStudentBound: false,
    isAdmin: false,
    isLoggedIn: false,
    showBindForm: false,
    showRequestForm: false,
    showPhoneRequestForm: false,
    bindName: '',
    bindStudentId: '',
    requestRealName: '',
    requestStudentId: '',
    requestPhone: '',
    requestReason: '',
    requestPhoneReason: '',
    changeReasonLabel: '',
    changeReasonPlaceholder: '',
    savePhoneChangeText: '',
    phoneChangeNewLabel: '',
    phoneChangeNewPlaceholder: '',
    cancelStudentIdChangeText: '',
    cancelPhoneChangeText: '',
    savingProfile: false,
    binding: false,
    requestingChange: false,
    avatarUploadData: '',
    avatarChanged: false,
  },

  onLoad() {
    if (!isLogin()) {
      redirectToLogin('/pages/personal-info/personal-info');
      return;
    }
    this.updateLanguage();
    this.loadProfile();
  },

  onShow() {
    if (!isLogin()) {
      redirectToLogin('/pages/personal-info/personal-info');
      return;
    }
    this.updateLanguage();
    this.loadProfile();
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    this.setData({
      navTitle: t('profile.center.personalInfo'),
      languageClass: app.globalData.languageClass || 'lang-zh',
      subtitle: t('profile.personal.subtitle'),
      usernameLabel: t('profile.personal.username'),
      usernamePlaceholder: t('profile.personal.usernamePlaceholder'),
      phoneLabel: t('profile.personal.phone'),
      phonePlaceholder: t('profile.personal.phonePlaceholder'),
      phoneBoundLabel: t('profile.personal.boundPhone'),
      phoneUnboundLabel: t('profile.personal.unboundPhone'),
      phoneChangeHint: t('profile.personal.phoneChangeHint'),
      phoneChangeText: t('profile.personal.changePhone'),
      cancelStudentIdChangeText: t('profile.personal.cancelStudentIdChange'),
      cancelPhoneChangeText: t('profile.personal.cancelPhoneChange'),
      savePhoneChangeText: t('profile.personal.submitPhoneChange'),
      phoneChangeNewLabel: t('profile.personal.newPhone'),
      phoneChangeNewPlaceholder: t('profile.personal.newPhonePlaceholder'),
      studentIdLabel: t('profile.user.studentId'),
      registerDateLabel: t('profile.personal.registerDate'),
      creditScoreLabel: t('common.field.creditScore'),
      bookingCountLabel: t('profile.user.bookingCount'),
      nameLabel: t('profile.personal.name'),
      studentIdPlaceholder: t('profile.personal.studentIdPlaceholder'),
      bindStudentIdText: t('profile.personal.bindStudentId'),
      requestChangeText: t('profile.personal.requestChange'),
      requestChangeHint: t('profile.personal.changeRequestHint'),
      changeReasonLabel: t('profile.personal.changeReasonLabel'),
      changeReasonPlaceholder: t('profile.personal.changeReasonPlaceholder'),
      uploadAvatarHint: t('profile.personal.uploadAvatarHint'),
      modifyAvatarText: t('profile.personal.modifyAvatar'),
      saveProfileText: t('profile.personal.save'),
    });
  },

  applyUser(user: any) {
    const normalized = normalizeUser(user);
    if (!normalized) return;

    const studentIdStatusText = normalized.isStudentBound
      ? t('profile.personal.boundStatus')
      : t('profile.personal.unboundStatus');

    this.setData({
      isLoggedIn: true,
      isAdmin: normalized.isAdmin,
      userName: getDisplayName(normalized) || t('profile.user.guest'),
      usernameField: normalized.username || '',
      phoneField: normalized.phone || '',
      phoneBound: !!normalized.phone,
      phoneLabel: normalized.phone
        ? t('profile.personal.boundPhone')
        : t('profile.personal.unboundPhone'),
      userRole: normalized.isAdmin ? t('profile.role.admin') : '',
      studentId: normalized.studentId
        ? maskStudentId(normalized.studentId)
        : t('profile.personal.unboundStatus'),
      studentIdStatusText,
      creditScore: '-',
      registerDate: normalized.createdAt ? formatDateTime(normalized.createdAt, 'YYYY-MM-DD') : '-',
      avatarUrl: normalized.avatarUrl || '',
      isStudentBound: normalized.isStudentBound,
      bindName: getDisplayName(normalized),
      bindStudentId: normalized.studentId || '',
      requestRealName: getDisplayName(normalized),
      requestStudentId: '',
      requestReason: '',
      showBindForm: false,
      showRequestForm: false,
    });

    this.loadMetrics();
  },

  loadProfile() {
    const cached = normalizeUser(getUserInfo());
    if (cached) {
      this.applyUser(cached);
    }

    getProfile()
      .then((res: any) => {
        const payload = res?.data ?? res;
        const user = normalizeUser(payload);
        if (!user) return;

        const nextUser = {
          ...(getUserInfo() || {}),
          ...user,
        };
        setUserInfo(nextUser);
        this.applyUser(nextUser);
      })
      .catch(() => {
        if (!cached) {
          wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
        }
      });
  },

  async loadMetrics() {
    if (!isLogin()) return;

    try {
      const creditRes: any = await getCredit();
      const summary = creditRes?.data ?? creditRes;
      const score = Number(summary.creditScore ?? summary.score ?? 0);
      this.setData({ creditScore: Number.isFinite(score) ? score : '-' });
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

  onBindStudentIdTap() {
    this.setData({ showBindForm: true, showRequestForm: false, showPhoneRequestForm: false });
  },

  onRequestPhoneChangeTap() {
    const open = !!this.data.showPhoneRequestForm;
    this.setData({
      showPhoneRequestForm: !open,
      showRequestForm: false,
      showBindForm: false,
      requestPhone: open ? '' : this.data.requestPhone,
      requestPhoneReason: open ? '' : this.data.requestPhoneReason,
    });
  },

  onRequestChangeTap() {
    const open = !!this.data.showRequestForm;
    this.setData({
      showRequestForm: !open,
      showPhoneRequestForm: false,
      showBindForm: false,
      requestStudentId: '',
      requestReason: open ? '' : '',
    });
  },

  onBindNameChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ bindName: String(e.detail || '') });
  },

  onUsernameChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ usernameField: String(e.detail || '') });
  },

  onPhoneChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ phoneField: String(e.detail || '') });
  },

  onBindStudentIdChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ bindStudentId: String(e.detail || '') });
  },

  onRequestRealNameChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ requestRealName: String(e.detail || '') });
  },

  onRequestStudentIdChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ requestStudentId: String(e.detail || '') });
  },

  onRequestPhoneFieldChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ requestPhone: String(e.detail || '') });
  },

  onRequestPhoneReasonChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ requestPhoneReason: String(e.detail || '') });
  },

  onRequestReasonChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ requestReason: String(e.detail || '') });
  },

  async onSaveProfile() {
    const { usernameField, phoneField, savingProfile, avatarChanged, avatarUploadData } = this.data;
    if (savingProfile) return;

    const username = String(usernameField || '').trim();
    const phone = String(phoneField || '').trim();

    if (!username) {
      wx.showToast({ title: t('profile.personal.usernameRequired'), icon: 'none' });
      return;
    }

    if (phone && !/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: t('profile.personal.phoneInvalid'), icon: 'none' });
      return;
    }

    const updateData: any = { username };
    if (!this.data.phoneBound && phone) {
      updateData.phone = phone;
    }
    if (avatarChanged && avatarUploadData) {
      updateData.avatar = avatarUploadData;
    }

    this.setData({ savingProfile: true });
    updateProfile(updateData)
      .then(() => getProfile())
      .then((res: any) => {
        const payload = res?.data ?? res;
        const user = normalizeUser(payload);
        const nextUser = {
          ...(getUserInfo() || {}),
          ...user,
        };
        setUserInfo(nextUser);
        this.applyUser(nextUser);
        this.setData({ avatarChanged: false, avatarUploadData: '' });
        wx.showToast({ title: t('common.hint.success'), icon: 'success' });
      })
      .catch((err: any) => {
        console.error('save profile failed', err);
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      })
      .finally(() => {
        this.setData({ savingProfile: false });
      });
  },

  async onSaveBinding() {
    const { bindName, bindStudentId, binding } = this.data;
    if (binding) return;

    const name = String(bindName || '').trim();
    const studentId = String(bindStudentId || '').trim();

    if (!name || !studentId) {
      wx.showToast({ title: t('profile.personal.studentIdRequired'), icon: 'none' });
      return;
    }

    if (!/^\d{11}$/.test(studentId)) {
      wx.showToast({ title: t('profile.personal.studentIdInvalid'), icon: 'none' });
      return;
    }

    this.setData({ binding: true });
    authApi
      .bindStudentId(studentId, name)
      .then(() => getProfile())
      .then((res: any) => {
        const payload = res?.data ?? res;
        const user = normalizeUser(payload);
        const nextUser = {
          ...(getUserInfo() || {}),
          ...user,
          name,
          nickName: name,
          studentId,
        };
        setUserInfo(nextUser);
        this.applyUser(nextUser);
        this.setData({ showBindForm: false });
        wx.showToast({ title: t('common.hint.success'), icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      })
      .finally(() => {
        this.setData({ binding: false });
      });
  },

  async onSavePhoneChangeRequest() {
    const { requestPhone, requestPhoneReason, requestingChange } = this.data;
    if (requestingChange) return;

    const phone = String(requestPhone || '').trim();
    const reason = String(requestPhoneReason || '').trim();

    if (!phone) {
      wx.showToast({ title: t('profile.personal.phoneRequired'), icon: 'none' });
      return;
    }

    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: t('profile.personal.phoneInvalid'), icon: 'none' });
      return;
    }

    if (phone === String(this.data.phoneField || '').trim()) {
      wx.showToast({ title: t('profile.personal.phoneSameError'), icon: 'none' });
      return;
    }

    this.setData({ requestingChange: true });
    authApi
      .requestPhoneChange(phone, reason)
      .then(() => {
        wx.showToast({ title: t('profile.personal.phoneChangeRequestSubmitted'), icon: 'success' });
        this.setData({
          showPhoneRequestForm: false,
          requestingChange: false,
          requestPhoneReason: '',
          requestPhone: '',
        });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
        this.setData({ requestingChange: false });
      });
  },

  async onSaveChangeRequest() {
    const { requestRealName, requestStudentId, requestReason, requestingChange } = this.data;
    if (requestingChange) return;

    const realName = String(requestRealName || '').trim();
    const studentId = String(requestStudentId || '').trim();
    const reason = String(requestReason || '').trim();

    if (!realName || !studentId) {
      wx.showToast({ title: t('profile.personal.studentIdRequired'), icon: 'none' });
      return;
    }

    if (!/^[0-9]{11}$/.test(studentId)) {
      wx.showToast({ title: t('profile.personal.studentIdInvalid'), icon: 'none' });
      return;
    }

    this.setData({ requestingChange: true });
    authApi
      .requestStudentIdChange(studentId, realName, reason)
      .then(() => {
        wx.showToast({ title: t('profile.personal.changeRequestSubmitted'), icon: 'success' });
        this.setData({ showRequestForm: false, requestingChange: false, requestReason: '' });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
        this.setData({ requestingChange: false });
      });
  },

  async onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
    const avatarUrl = e.detail?.avatarUrl;
    if (!avatarUrl) return;

    try {
      const avatarUploadData = await readLocalImageAsDataUrl(avatarUrl);
      this.setData({ avatarUrl, avatarUploadData, avatarChanged: true });
    } catch (error) {
      console.error('avatar selection failed', error);
      wx.showToast({ title: t('common.hint.error'), icon: 'none' });
    }
  },
});
