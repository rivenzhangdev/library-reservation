import * as authApi from '../../apis/auth';
import { maskName } from '../../utils/util';
import { getProfile, updateProfile, getCredit } from '../../apis/user';
import { getMyBookings } from '../../apis/booking';
import { getUserInfo, isLogin, redirectToLogin, setUserInfo } from '../../utils/auth';
import { readLocalImageAsDataUrl } from '../../utils/file';
import { t } from '../../utils/i18n';

function normalizeUser(user: any) {
  if (!user) return null;

  const studentId = String(user.studentId || '').trim();
  const avatarUrl = String(user.avatarUrl || user.avatar || '').trim();
  const { avatar: _avatar, ...rest } = user;
  return {
    ...rest,
    id: user.id,
    username: user.username || '',
    nickName: user.nickName || user.name || '',
    name: user.name || user.nickName || '',
    avatarUrl,
    studentId,
    email: String(user.email || '').trim(),
    phone: user.phone || '',
    studentProfile: user.studentProfile || null,
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

function getFieldValue(e: WechatMiniprogram.CustomEvent) {
  const detail = (e as any)?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail.value === 'string') return detail.value;
  return '';
}

function normalizeReasonCode(value: unknown) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function getSurnameAndRemainingLength(maskedName: string) {
  const text = String(maskedName || '').trim();
  if (!text) {
    return { surname: '', remainingLength: 1 };
  }
  const surname = text.charAt(0);
  const remainingLength = Math.max(1, text.length - 1);
  return { surname, remainingLength };
}

Page({
  data: {
    currentLang: 'zh' as 'zh' | 'en',
    navTitle: '',
    languageClass: 'lang-zh',
    subtitle: '',
    nameLabel: '',
    usernameLabel: '',
    usernamePlaceholder: '',
    phoneLabel: '',
    phonePlaceholder: '',
    emailLabel: '',
    emailPlaceholder: '',
    phoneBoundLabel: '',
    phoneUnboundLabel: '',
    studentIdLabel: '',
    studentIdPlaceholder: '',
    registerDateLabel: '',
    creditScoreLabel: '',
    bookingCountLabel: '',
    bindStudentIdText: '',
    bindSubmitText: '',
    requestChangeText: '',
    requestChangeHint: '',
    requestChangeVerifyHint: '',
    requestChangeMissingNameHint: '',
    modifyAvatarText: '',
    saveProfileText: '',
    userName: '',
    usernameField: '',
    emailField: '',
    phoneField: '',
    phoneBound: false,
    phoneChangeHint: '',
    phoneChangeText: '',
    userRole: '',
    studentId: '',
    studentIdStatusText: '',
    studentProfileTitle: '',
    collegeLabel: '',
    majorLabel: '',
    gradeLabel: '',
    studentCollege: '',
    studentMajor: '',
    studentGrade: '',
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
    // 自定义原因弹窗：'appeal' | 'change' | ''
    showReasonModal: '' as '' | 'appeal' | 'change',
    // 待审核改绑状态
    pendingChangeRequest: null as null | {
      newStudentId: string;
      newRealName: string;
      createdAt: string;
    },
    maskedTargetStudentId: '',
    maskedTargetName: '',
    bindName: '',
    bindNamePartInput: '',
    bindNamePartChars: [] as string[],
    bindStudentId: '',
    bindPrecheckStatus: '',
    bindPrecheckMessage: '',
    bindPrecheckReasonCode: '',
    bindCollege: '',
    bindMajor: '',
    bindGrade: '',
    bindMaskedName: '',
    bindableStudentId: '',
    bindNameVerifyPlaceholder: '',
    bindPrecheckMatchedHint: '',
    showBindNameVerifyPopup: false,
    bindNameVerifyPrefix: '',
    bindNameVerifySuffix: '',
    bindNameVerifyMaskLength: 2,
    bindNameVerifyRequiredLength: 1,
    bindNameVerifyFocusIndex: 0,
    bindNameVerifyTitle: '',
    bindNameVerifyHint: '',
    bindNameVerifyConfirmText: '',
    bindNameVerifyCancelText: '',
    nameVerifyScene: '' as '' | 'bind' | 'change',
    nameVerifyStudentId: '',
    changeVerifiedRealName: '',
    precheckingStudentId: false,
    studentRealName: '',
    requestStudentId: '',
    requestPhone: '',
    requestReason: '',
    requestPhoneReason: '',
    changeReasonLabel: '',
    changeReasonPlaceholder: '',
    savePhoneChangeText: '',
    submitAppealText: '',
    phoneChangeNewLabel: '',
    phoneChangeNewPlaceholder: '',
    cancelStudentIdChangeText: '',
    cancelPhoneChangeText: '',
    savingProfile: false,
    binding: false,
    requestingChange: false,
    avatarUploadData: '',
    avatarChanged: false,
    studentIdAppealTitle: '',
    studentIdAppealPlaceholder: '',
    studentIdAppealReason: '',
    submitStudentIdAppealLoading: false,
    appealFeedbackType: '',
    appealFeedbackText: '',
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

  onUnload() {
    const timer = (this as any)._studentIdPrecheckTimer;
    if (timer) {
      clearTimeout(timer);
      (this as any)._studentIdPrecheckTimer = null;
    }
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    const currentLang = app.globalData.currentLang || 'zh';
    this.setData({
      currentLang,
      navTitle: t('profile.center.personalInfo'),
      languageClass: app.globalData.languageClass || 'lang-zh',
      subtitle: t('profile.personal.subtitle'),
      usernameLabel: t('profile.personal.username'),
      usernamePlaceholder: t('profile.personal.usernamePlaceholder'),
      phoneLabel: t('profile.personal.phone'),
      phonePlaceholder: t('profile.personal.phonePlaceholder'),
      emailLabel: t('profile.personal.email'),
      emailPlaceholder: t('profile.personal.emailPlaceholder'),
      phoneBoundLabel: t('profile.personal.boundPhone'),
      phoneUnboundLabel: t('profile.personal.unboundPhone'),
      phoneChangeHint: t('profile.personal.phoneChangeHint'),
      phoneChangeText: t('profile.personal.changePhone'),
      cancelStudentIdChangeText: t('profile.personal.cancelStudentIdChange'),
      cancelPhoneChangeText: t('profile.personal.cancelPhoneChange'),
      savePhoneChangeText: t('profile.personal.submitPhoneChange'),
      submitAppealText: t('profile.personal.submitAppeal'),
      phoneChangeNewLabel: t('profile.personal.newPhone'),
      phoneChangeNewPlaceholder: t('profile.personal.newPhonePlaceholder'),
      studentIdLabel: t('profile.user.studentId'),
      registerDateLabel: t('profile.personal.registerDate'),
      creditScoreLabel: t('common.field.creditScore'),
      bookingCountLabel: t('profile.user.bookingCount'),
      nameLabel: t('profile.personal.name'),
      studentIdPlaceholder: t('profile.personal.studentIdPlaceholder'),
      studentProfileTitle: t('profile.personal.studentProfileTitle'),
      collegeLabel: t('profile.personal.college'),
      majorLabel: t('profile.personal.major'),
      gradeLabel: t('profile.personal.grade'),
      bindStudentIdText: t('profile.personal.bindStudentId'),
      bindSubmitText: t('profile.personal.bindStudentId'),
      requestChangeText: t('profile.personal.requestChange'),
      requestChangeHint: t('profile.personal.changeRequestHint'),
      requestChangeVerifyHint:
        currentLang === 'zh'
          ? '提交改绑前需先对目标学号进行姓名核验，随后进入管理员审批。'
          : 'Before submitting a change request, verify the target student ID name, then it goes to admin approval.',
      requestChangeMissingNameHint:
        currentLang === 'zh'
          ? '请先输入目标学号并完成姓名核验。'
          : 'Please enter target student ID and complete name verification first.',
      changeReasonLabel: t('profile.personal.changeReasonLabel'),
      changeReasonPlaceholder: t('profile.personal.changeReasonPlaceholder'),
      uploadAvatarHint: t('profile.personal.uploadAvatarHint'),
      modifyAvatarText: t('profile.personal.modifyAvatar'),
      saveProfileText: t('profile.personal.save'),
      studentIdAppealTitle: t('profile.personal.studentIdAppealTitle'),
      studentIdAppealPlaceholder: t('profile.personal.studentIdAppealPlaceholder'),
      bindPrecheckMatchedHint:
        currentLang === 'zh'
          ? '已匹配到学籍记录，绑定后将同步院系、专业和年级。'
          : 'Student registry matched. College, major and grade will sync after binding.',
      bindNameVerifyTitle: currentLang === 'zh' ? '姓名核验' : 'Name Verification',
      bindNameVerifyHint:
        currentLang === 'zh'
          ? '请补全中间姓名字符，验证后完成学号绑定'
          : 'Complete the hidden middle name characters to finish binding.',
      bindNameVerifyPlaceholder: currentLang === 'zh' ? '输入中间姓名' : 'Enter hidden part',
      bindNameVerifyConfirmText: currentLang === 'zh' ? '验证并绑定' : 'Verify & Bind',
      bindNameVerifyCancelText: t('common.btn.cancel'),
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
      emailField: normalized.email || '',
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
      studentCollege: String(normalized.studentProfile?.college || '').trim(),
      studentMajor: String(normalized.studentProfile?.major || '').trim(),
      studentGrade: String(normalized.studentProfile?.grade || '').trim(),
      creditScore: '-',
      registerDate: normalized.createdAt ? String(normalized.createdAt).slice(0, 10) : '-',
      avatarUrl: normalized.avatarUrl || '',
      isStudentBound: normalized.isStudentBound,
      bindName: '',
      bindStudentId: normalized.studentId || '',
      studentRealName: String(normalized.studentProfile?.realName || '').trim(),
      requestStudentId: '',
      requestReason: '',
      showBindForm: false,
      showRequestForm: false,
      studentIdAppealReason: '',
      appealFeedbackType: '',
      appealFeedbackText: '',
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

        // Always check pending request status (appeal/change both use the same table)
        this.loadPendingChangeRequest();
      })
      .catch(() => {
        if (!cached) {
          wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
        }
      });
  },

  loadPendingChangeRequest() {
    authApi
      .getMyPendingChangeRequest()
      .then((res: any) => {
        const data = res?.data ?? null;
        const newStudentId = String(data?.newStudentId || '').trim();
        const newRealName = String(data?.newRealName || '').trim();
        this.setData({
          pendingChangeRequest: data,
          maskedTargetStudentId: newStudentId ? maskStudentId(newStudentId) : '',
          maskedTargetName: newRealName ? maskName(newRealName) : '',
        });
      })
      .catch(() => {
        this.setData({
          pendingChangeRequest: null,
          maskedTargetStudentId: '',
          maskedTargetName: '',
        });
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
      const bookingRes: any = await getMyBookings({ page: 1, pageSize: 1 });
      const total = bookingRes?.data?.total ?? 0;
      this.setData({ bookingCount: total });
    } catch {
      this.setData({ bookingCount: 0 });
    }
  },

  onBindStudentIdTap() {
    this.setData({
      showBindForm: true,
      showRequestForm: false,
      showPhoneRequestForm: false,
      studentIdAppealReason: '',
      appealFeedbackType: '',
      appealFeedbackText: '',
      bindPrecheckStatus: '',
      bindPrecheckMessage: '',
      bindPrecheckReasonCode: '',
      bindCollege: '',
      bindMajor: '',
      bindGrade: '',
      bindMaskedName: '',
      bindableStudentId: '',
      bindNamePartInput: '',
      bindNamePartChars: [],
      bindName: '',
      showBindNameVerifyPopup: false,
      bindSubmitText: t('profile.personal.bindStudentId'),
    });
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
      studentIdAppealReason: '',
      appealFeedbackType: '',
      appealFeedbackText: '',
      requestStudentId: '',
      changeVerifiedRealName: '',
      requestReason: open ? '' : '',
    });
  },

  onBindNameChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ bindName: getFieldValue(e) });
  },

  onBindNamePartCharInput(e: WechatMiniprogram.CustomEvent) {
    const index = Number((e as any)?.currentTarget?.dataset?.index ?? 0);
    const requiredLength = Math.max(1, Number(this.data.bindNameVerifyRequiredLength || 1));
    const currentChars = Array.isArray(this.data.bindNamePartChars)
      ? [...this.data.bindNamePartChars]
      : Array.from({ length: requiredLength }, () => '');
    const nextChars = currentChars.slice(0, requiredLength);
    while (nextChars.length < requiredLength) {
      nextChars.push('');
    }

    const rawValue = String(getFieldValue(e) || '');
    const chars = Array.from(rawValue.replace(/\s+/g, ''));
    const singleChar = chars.length ? chars[0] : '';

    if (!singleChar) {
      nextChars[index] = '';
      this.setData({
        bindNamePartChars: nextChars,
        bindNamePartInput: nextChars.join(''),
        bindNameVerifyFocusIndex: index > 0 ? index - 1 : 0,
      });
      return;
    }

    nextChars[index] = singleChar;
    const nextFocusIndex = index + 1 >= requiredLength ? requiredLength - 1 : index + 1;
    this.setData({
      bindNamePartChars: nextChars,
      bindNamePartInput: nextChars.join(''),
      bindNameVerifyFocusIndex: nextFocusIndex,
    });
  },

  onBindNamePartCharFocus(e: WechatMiniprogram.CustomEvent) {
    const index = Number((e as any)?.currentTarget?.dataset?.index ?? 0);
    this.setData({ bindNameVerifyFocusIndex: index });
  },

  openNameVerifyPopup(maskedNameInput: string, scene: 'bind' | 'change', studentId: string) {
    const maskedName = String(maskedNameInput || '').trim();
    if (!maskedName || !maskedName.includes('*')) {
      wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      return;
    }
    const { surname, remainingLength } = getSurnameAndRemainingLength(maskedName);
    const isZh = this.data.currentLang === 'zh';
    this.setData({
      showBindNameVerifyPopup: true,
      nameVerifyScene: scene,
      nameVerifyStudentId: studentId,
      bindNameVerifyPrefix: surname,
      bindNameVerifySuffix: '',
      bindNameVerifyMaskLength: remainingLength,
      bindNameVerifyRequiredLength: remainingLength,
      bindNamePartInput: '',
      bindNamePartChars: Array.from({ length: remainingLength }, () => ''),
      bindNameVerifyFocusIndex: 0,
      bindNameVerifyTitle: isZh ? '姓名核验' : 'Name Verification',
      bindNameVerifyHint:
        scene === 'change'
          ? isZh
            ? '请补全目标学号对应姓名，用于改绑申请核验'
            : 'Complete target-student-name characters for change-request verification.'
          : isZh
            ? '请补全中间姓名字符，验证后完成学号绑定'
            : 'Complete the hidden middle name characters to finish binding.',
      bindNameVerifyConfirmText:
        scene === 'change'
          ? isZh
            ? '验证并继续'
            : 'Verify & Continue'
          : isZh
            ? '验证并绑定'
            : 'Verify & Bind',
    });
  },

  openBindNameVerifyPopup() {
    const maskedName = String(this.data.bindMaskedName || '').trim();
    const studentId = String(this.data.bindStudentId || '').trim();
    this.openNameVerifyPopup(maskedName, 'bind', studentId);
  },

  onCloseBindNameVerifyPopup() {
    this.setData({
      showBindNameVerifyPopup: false,
      nameVerifyScene: '',
      nameVerifyStudentId: '',
      bindNamePartInput: '',
      bindNamePartChars: [],
      bindNameVerifyFocusIndex: 0,
      binding: false,
    });
  },

  submitBinding(studentId: string, fullName: string) {
    this.setData({ binding: true });
    authApi
      .bindStudentId(studentId, fullName)
      .then(() => getProfile())
      .then((res: any) => {
        const payload = res?.data ?? res;
        const user = normalizeUser(payload);
        const nextUser = {
          ...(getUserInfo() || {}),
          ...user,
          name: fullName,
          nickName: fullName,
          studentId,
        };
        setUserInfo(nextUser);
        this.applyUser(nextUser);
        this.setData({
          showBindForm: false,
          showBindNameVerifyPopup: false,
          bindNamePartInput: '',
          bindNamePartChars: [],
          bindNameVerifyFocusIndex: 0,
        });
        wx.showToast({ title: t('common.hint.success'), icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      })
      .finally(() => {
        this.setData({ binding: false });
      });
  },

  onConfirmBindNameVerify() {
    if (this.data.binding) return;

    const studentId = String(this.data.nameVerifyStudentId || this.data.bindStudentId || '').trim();
    const part = Array.isArray(this.data.bindNamePartChars)
      ? this.data.bindNamePartChars.join('').trim()
      : String(this.data.bindNamePartInput || '').trim();
    const prefix = String(this.data.bindNameVerifyPrefix || '');
    const requiredLength = Number(this.data.bindNameVerifyRequiredLength || 1);

    if (!studentId || !/^\d{11}$/.test(studentId)) {
      wx.showToast({ title: t('profile.personal.studentIdInvalid'), icon: 'none' });
      return;
    }
    if (!part || part.length !== requiredLength) {
      wx.showToast({
        title:
          this.data.currentLang === 'zh'
            ? `请输入${requiredLength}个姓名字符`
            : `Please enter ${requiredLength} name characters`,
        icon: 'none',
      });
      return;
    }

    const fullName = `${prefix}${part}`;
    const scene = this.data.nameVerifyScene;

    if (scene === 'change') {
      this.setData({
        changeVerifiedRealName: fullName,
        showBindNameVerifyPopup: false,
        nameVerifyScene: '',
        nameVerifyStudentId: '',
        bindNamePartInput: '',
        bindNamePartChars: [],
        bindNameVerifyFocusIndex: 0,
        showReasonModal: 'change',
        requestReason: '',
      });
      return;
    }

    this.setData({ bindName: fullName });
    this.submitBinding(studentId, fullName);
  },

  onUsernameChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ usernameField: getFieldValue(e) });
  },

  onPhoneChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ phoneField: getFieldValue(e) });
  },

  onEmailChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ emailField: getFieldValue(e) });
  },

  onBindStudentIdChange(e: WechatMiniprogram.CustomEvent) {
    const bindStudentId = getFieldValue(e).trim();
    this.setData({ bindStudentId });

    const timer = (this as any)._studentIdPrecheckTimer;
    if (timer) {
      clearTimeout(timer);
    }

    (this as any)._studentIdPrecheckTimer = setTimeout(() => {
      this.runStudentIdPrecheck(false);
    }, 320);
  },

  onBindStudentIdBlur() {
    this.runStudentIdPrecheck(true);
  },

  getStudentIdPrecheckMessage(reasonCode: string) {
    const reason = normalizeReasonCode(reasonCode);
    if (reason === 'OK') return t('profile.personal.studentIdPrecheckOk');
    if (reason === 'ALREADY_BOUND') return t('profile.personal.studentIdPrecheckBound');
    if (reason === 'NOT_FOUND') return t('profile.personal.studentIdPrecheckNotFound');
    if (reason === 'SELF_ALREADY_BOUND') return t('profile.personal.studentIdPrecheckSelfBound');
    return t('common.hint.error');
  },

  async runStudentIdPrecheck(force: boolean) {
    const studentId = String(this.data.bindStudentId || '').trim();
    if (!studentId) {
      this.setData({
        bindPrecheckStatus: '',
        bindPrecheckMessage: '',
        bindPrecheckReasonCode: '',
        bindCollege: '',
        bindMajor: '',
        bindGrade: '',
        bindMaskedName: '',
        bindableStudentId: '',
        bindSubmitText: t('profile.personal.bindStudentId'),
      });
      return;
    }

    if (!/^\d{11}$/.test(studentId)) {
      this.setData({
        bindPrecheckStatus: 'invalid',
        bindPrecheckMessage: t('profile.personal.studentIdInvalid'),
        bindPrecheckReasonCode: 'INVALID',
        bindCollege: '',
        bindMajor: '',
        bindGrade: '',
        bindMaskedName: '',
        bindableStudentId: '',
      });
      return;
    }

    const requestId = ((this as any)._studentIdPrecheckRequestId || 0) + 1;
    (this as any)._studentIdPrecheckRequestId = requestId;
    this.setData({ precheckingStudentId: true });

    try {
      const response: any = await authApi.precheckStudentId(studentId);
      if ((this as any)._studentIdPrecheckRequestId !== requestId) {
        return;
      }

      const payload = response?.data ?? response ?? {};
      const bindable = !!payload.bindable;
      const reasonCode = normalizeReasonCode(payload.reasonCode);
      const status = bindable ? 'ok' : 'blocked';
      const message = this.getStudentIdPrecheckMessage(reasonCode);
      const maskedName = String(payload.maskedName || '').trim();
      const college = String(payload.college || '').trim();
      const major = String(payload.major || '').trim();
      const grade = String(payload.grade || '').trim();

      const updates: Record<string, any> = {
        bindPrecheckStatus: status,
        bindPrecheckMessage: message,
        bindPrecheckReasonCode: reasonCode,
        bindMaskedName: maskedName,
        bindCollege: college,
        bindMajor: major,
        bindGrade: grade,
        bindableStudentId: bindable ? studentId : '',
        bindSubmitText: bindable
          ? this.data.currentLang === 'zh'
            ? '核验姓名并绑定'
            : 'Verify Name & Bind'
          : t('profile.personal.bindStudentId'),
      };

      this.setData(updates);

      if (force && !bindable) {
        wx.showToast({ title: message, icon: 'none' });
      }
    } catch {
      if ((this as any)._studentIdPrecheckRequestId !== requestId) {
        return;
      }
      this.setData({
        bindPrecheckStatus: 'error',
        bindPrecheckMessage: t('common.hint.error'),
        bindPrecheckReasonCode: 'ERROR',
        bindCollege: '',
        bindMajor: '',
        bindGrade: '',
        bindMaskedName: '',
        bindableStudentId: '',
      });
      if (force) {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      }
    } finally {
      if ((this as any)._studentIdPrecheckRequestId === requestId) {
        this.setData({ precheckingStudentId: false });
      }
    }
  },

  onRequestStudentIdChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ requestStudentId: getFieldValue(e) });
  },

  onRequestPhoneFieldChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ requestPhone: getFieldValue(e) });
  },

  onRequestPhoneReasonChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ requestPhoneReason: getFieldValue(e) });
  },

  onRequestReasonChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ requestReason: getFieldValue(e) });
  },

  canSubmitStudentIdAppeal() {
    const reasonCode = String(this.data.bindPrecheckReasonCode || '').toUpperCase();
    return reasonCode === 'ALREADY_BOUND' || reasonCode === 'NOT_FOUND';
  },

  onSubmitStudentIdAppeal() {
    if (!this.canSubmitStudentIdAppeal()) {
      this.setData({
        appealFeedbackType: 'error',
        appealFeedbackText: t('profile.personal.studentIdAppealUnavailable'),
      });
      return;
    }

    const studentId = String(this.data.bindStudentId || '').trim();
    const realName = String(this.data.bindName || this.data.userName || '').trim();

    if (!/^\d{11}$/.test(studentId) || !realName) {
      this.setData({
        appealFeedbackType: 'error',
        appealFeedbackText: t('profile.personal.studentIdAppealUnavailable'),
      });
      return;
    }

    // Open modal instead of inline form
    this.setData({
      showReasonModal: 'appeal',
      studentIdAppealReason: '',
      submitStudentIdAppealLoading: false,
      appealFeedbackType: '',
      appealFeedbackText: '',
    });
  },

  onStudentIdAppealReasonChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ studentIdAppealReason: getFieldValue(e) });
  },

  onCancelStudentIdAppeal() {
    this.setData({
      showReasonModal: '',
      studentIdAppealReason: '',
      submitStudentIdAppealLoading: false,
    });
  },

  onCloseReasonModal() {
    this.setData({
      showReasonModal: '',
      submitStudentIdAppealLoading: false,
      requestingChange: false,
    });
  },

  async onConfirmStudentIdAppeal() {
    if (this.data.submitStudentIdAppealLoading) return;

    const reason = String(this.data.studentIdAppealReason || '').trim();
    if (!reason) {
      this.setData({
        appealFeedbackType: 'error',
        appealFeedbackText: t('profile.personal.changeReasonPlaceholder'),
      });
      return;
    }

    const studentId = String(this.data.bindStudentId || '').trim();
    const realName = String(this.data.bindName || this.data.userName || '').trim();
    const precheckReasonCode = String(this.data.bindPrecheckReasonCode || '').trim();

    if (!/^\d{11}$/.test(studentId) || !realName) {
      this.setData({
        appealFeedbackType: 'error',
        appealFeedbackText: t('profile.personal.studentIdAppealUnavailable'),
      });
      return;
    }

    this.setData({ submitStudentIdAppealLoading: true });
    try {
      await authApi.submitStudentIdBindAppeal({
        studentId,
        realName,
        reason,
        precheckReasonCode,
      });

      this.setData({
        showBindForm: false,
        showReasonModal: '',
        bindStudentId: '',
        bindName: '',
        bindPrecheckStatus: '',
        bindPrecheckMessage: '',
        bindPrecheckReasonCode: '',
        bindMaskedName: '',
        bindCollege: '',
        bindMajor: '',
        bindGrade: '',
        bindableStudentId: '',
        studentIdAppealReason: '',
        appealFeedbackType: 'ok',
        appealFeedbackText:
          t('profile.personal.studentIdAppealSubmitted') +
          ' 已进入改绑审批列表，审核结果会通过通知告知。',
      });
      this.loadPendingChangeRequest();
    } catch (err: any) {
      const rawMessage = String(err?.message || '').trim();
      const friendlyMessage =
        rawMessage.includes('pending appeal') || rawMessage.includes('pending change request')
          ? '你已有待处理申请，请勿重复提交。可在通知中心查看进度。'
          : rawMessage || t('common.hint.error');

      this.setData({
        appealFeedbackType: 'error',
        appealFeedbackText: friendlyMessage,
      });
    } finally {
      this.setData({ submitStudentIdAppealLoading: false });
    }
  },

  async onSaveProfile() {
    const { usernameField, phoneField, savingProfile, avatarChanged, avatarUploadData } = this.data;
    if (savingProfile) return;

    const username = String(usernameField || '').trim();
    const email = String(this.data.emailField || '').trim();
    const phone = String(phoneField || '').trim();

    if (!username) {
      wx.showToast({ title: t('profile.personal.usernameRequired'), icon: 'none' });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      wx.showToast({ title: t('profile.personal.emailInvalid'), icon: 'none' });
      return;
    }

    if (phone && !/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: t('profile.personal.phoneInvalid'), icon: 'none' });
      return;
    }

    const updateData: any = { username };
    if (email) {
      updateData.email = email;
    }
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
        const message = String(err?.message || err?.error?.message || '').trim();
        wx.showToast({ title: message || t('common.hint.error'), icon: 'none' });
      })
      .finally(() => {
        this.setData({ savingProfile: false });
      });
  },

  async onSaveBinding() {
    const { bindName, bindStudentId, binding } = this.data;
    if (binding) return;

    const studentId = String(bindStudentId || '').trim();

    if (!studentId) {
      wx.showToast({ title: t('profile.personal.studentIdRequired'), icon: 'none' });
      return;
    }

    if (!/^\d{11}$/.test(studentId)) {
      wx.showToast({ title: t('profile.personal.studentIdInvalid'), icon: 'none' });
      return;
    }

    if (this.data.bindableStudentId !== studentId) {
      await this.runStudentIdPrecheck(true);
      if (this.data.bindableStudentId !== studentId) {
        wx.showToast({
          title: this.data.bindPrecheckMessage || t('common.hint.error'),
          icon: 'none',
        });
        return;
      }
    }

    const maskedName = String(this.data.bindMaskedName || '').trim();
    if (maskedName && maskedName.includes('*')) {
      this.openBindNameVerifyPopup();
      return;
    }

    const name = String(bindName || '').trim();
    if (!name) {
      wx.showToast({ title: t('profile.personal.studentIdRequired'), icon: 'none' });
      return;
    }
    this.submitBinding(studentId, name);
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
      .catch((err: any) => {
        const msg = String(err?.message || '').trim();
        wx.showToast({ title: msg || t('common.hint.error'), icon: 'none' });
        this.setData({ requestingChange: false });
      });
  },

  async onSaveChangeRequest() {
    const { requestStudentId, requestingChange } = this.data;
    if (requestingChange) return;

    const studentId = String(requestStudentId || '').trim();

    if (!studentId) {
      wx.showToast({ title: t('profile.personal.studentIdRequired'), icon: 'none' });
      return;
    }

    if (!/^[0-9]{11}$/.test(studentId)) {
      wx.showToast({ title: t('profile.personal.studentIdInvalid'), icon: 'none' });
      return;
    }

    try {
      const response: any = await authApi.precheckStudentId(studentId, { forChange: true });
      const payload = response?.data ?? response ?? {};
      const bindable = !!payload.bindable;
      const reasonCode = normalizeReasonCode(payload.reasonCode);
      if (!bindable) {
        wx.showToast({ title: this.getStudentIdPrecheckMessage(reasonCode), icon: 'none' });
        return;
      }

      const maskedName = String(payload.maskedName || '').trim();
      if (!maskedName || !maskedName.includes('*')) {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
        return;
      }

      this.openNameVerifyPopup(maskedName, 'change', studentId);
    } catch {
      wx.showToast({ title: t('common.hint.error'), icon: 'none' });
    }
  },

  async onConfirmReasonModal() {
    const { showReasonModal, requestReason } = this.data;

    if (showReasonModal === 'change') {
      const reason = String(requestReason || '').trim();
      if (!reason) {
        wx.showToast({ title: t('profile.personal.changeReasonPlaceholder'), icon: 'none' });
        return;
      }
      const realName = String(this.data.changeVerifiedRealName || '').trim();
      const studentId = String(this.data.requestStudentId || '').trim();
      if (!realName) {
        wx.showToast({
          title:
            this.data.currentLang === 'zh'
              ? this.data.requestChangeMissingNameHint
              : 'Please complete target student name verification first.',
          icon: 'none',
        });
        return;
      }
      this.setData({ showReasonModal: '', requestingChange: true });
      authApi
        .requestStudentIdChange(studentId, realName, reason)
        .then(() => {
          wx.showToast({ title: t('profile.personal.changeRequestSubmitted'), icon: 'success' });
          this.setData({
            showRequestForm: false,
            requestingChange: false,
            requestReason: '',
            requestStudentId: '',
          });
          this.loadPendingChangeRequest();
        })
        .catch((err: any) => {
          const msg = String(err?.message || '').trim();
          const friendlyMsg =
            msg === 'Real name does not match registry'
              ? this.data.currentLang === 'zh'
                ? '目标学号与核验姓名不一致，请重新核验后提交'
                : 'Target student ID and verified name do not match. Please verify again.'
              : msg || t('common.hint.error');
          wx.showToast({ title: friendlyMsg, icon: 'none' });
          this.setData({ requestingChange: false });
        });
      return;
    }

    if (showReasonModal === 'appeal') {
      await this.onConfirmStudentIdAppeal();
    }
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
