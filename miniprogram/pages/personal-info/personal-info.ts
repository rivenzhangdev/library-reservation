import { bindStudentId } from '../../apis/auth';
import { getProfile, updateProfile } from '../../apis/user';
import { getUserInfo, isLogin, setUserInfo } from '../../utils/auth';
import { readLocalImageAsDataUrl } from '../../utils/file';
import { t } from '../../utils/i18n';

function normalizeUser(user: any) {
  if (!user) return null;

  const studentId = String(user.studentId || '').trim();
  return {
    ...user,
    id: user.id || user._id,
    username: user.username || '',
    nickName: user.nickName || user.name || '',
    name: user.name || user.nickName || user.username || '',
    avatar: user.avatar || user.avatarUrl || '',
    avatarUrl: user.avatarUrl || user.avatar || '',
    studentId,
    phone: user.phone || '',
    isStudentBound: !!studentId,
  };
}

function getDisplayName(user: any) {
  if (!user) return '';

  const preferredName = user.nickName || user.name || '';
  if (!user.isStudentBound) {
    return preferredName || user.username || '';
  }

  return preferredName || user.username || '';
}

Page({
  data: {
    navTitle: '',
    languageClass: 'lang-zh',
    subtitle: '',
    avatarLabel: '',
    nameLabel: '',
    studentIdLabel: '',
    phoneLabel: '',
    identityTitle: '',
    personalInfoTitle: '',
    studentIdStatusText: '',
    profileHint: '',
    bindHint: '',
    studentIdPlaceholder: '',
    phonePlaceholder: '',
    chooseAvatarText: '',
    saveText: '',
    studentIdReadonly: false,
    isLoggedIn: false,
    form: {
      name: '',
      studentId: '',
      phone: '',
      avatarUrl: '',
    },
    avatarUploadData: '',
    avatarChanged: false,
    saving: false,
  },

  onLoad() {
    this.updateLanguage();
    this.loadProfile();
  },

  onShow() {
    this.updateLanguage();
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    const isLoggedIn = isLogin();
    this.setData({
      navTitle: t('profile.center.personalInfo'),
      languageClass: app.globalData.languageClass || 'lang-zh',
      subtitle: t('profile.personal.subtitle'),
      avatarLabel: t('profile.personal.avatar'),
      nameLabel: t('profile.personal.name'),
      studentIdLabel: t('profile.personal.studentId'),
      phoneLabel: t('profile.personal.phone'),
      identityTitle: t('profile.personal.identityTitle'),
      personalInfoTitle: t('profile.personal.infoTitle'),
      studentIdStatusText: '',
      bindHint: t('profile.personal.bindHint'),
      studentIdPlaceholder: t('profile.personal.studentIdPlaceholder'),
      phonePlaceholder: t('profile.personal.phonePlaceholder'),
      chooseAvatarText: t('profile.personal.chooseAvatar'),
      saveText: t('profile.personal.save'),
      isLoggedIn,
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
      studentIdReadonly: normalized.isStudentBound,
      studentIdStatusText,
      profileHint: normalized.isStudentBound
        ? t('profile.personal.boundHint')
        : t('profile.personal.bindHint'),
      form: {
        name: getDisplayName(normalized),
        studentId: normalized.studentId || '',
        phone: normalized.phone || '',
        avatarUrl: normalized.avatarUrl || '',
      },
    });
  },

  loadProfile() {
    const cached = normalizeUser(getUserInfo());
    if (cached) {
      this.applyUser(cached);
    }

    getProfile()
      .then((res: any) => {
        const user = normalizeUser(res.data);
        if (!user) return;

        setUserInfo({
          ...(getUserInfo() || {}),
          ...user,
        });
        this.applyUser(user);
      })
      .catch(() => {
        if (!cached) {
          wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
        }
      });
  },

  onNameChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      'form.name': e.detail,
    });
  },

  onStudentIdChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      'form.studentId': e.detail,
    });
  },

  onPhoneChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      'form.phone': e.detail,
    });
  },

  async onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
    const avatarUrl = e.detail?.avatarUrl;
    if (!avatarUrl) return;

    try {
      const avatarUploadData = await readLocalImageAsDataUrl(avatarUrl);
      this.setData({
        'form.avatarUrl': avatarUrl,
        avatarUploadData,
        avatarChanged: true,
      });
    } catch (error) {
      console.error('read avatar failed', error);
      wx.showToast({ title: t('common.hint.uploadFailed'), icon: 'none' });
    }
  },

  onSave() {
    const { form, avatarChanged, avatarUploadData, saving, studentIdReadonly } = this.data;
    if (saving) return;

    const name = String(form.name || '').trim();
    const studentId = String(form.studentId || '').trim();

    if (!name) {
      wx.showToast({ title: t('profile.personal.nameRequired'), icon: 'none' });
      return;
    }

    if (!studentIdReadonly && !studentId) {
      wx.showToast({ title: t('profile.personal.studentIdRequired'), icon: 'none' });
      return;
    }

    const payload: Record<string, any> = {
      name,
      phone: String(form.phone || '').trim(),
    };
    if (avatarChanged && avatarUploadData) {
      payload.avatar = avatarUploadData;
    }

    this.setData({ saving: true });

    const bindTask = studentIdReadonly ? Promise.resolve(null) : bindStudentId(studentId, name);

    bindTask
      .then(() => updateProfile(payload))
      .then(() => {
        const current = normalizeUser(getUserInfo()) || {};
        const nextUser = {
          ...current,
          name,
          nickName: name,
          studentId: studentIdReadonly ? current.studentId : studentId,
          avatar: form.avatarUrl || current.avatar,
          avatarUrl: form.avatarUrl || current.avatarUrl,
        };
        setUserInfo(nextUser);
        this.setData({
          avatarChanged: false,
          avatarUploadData: '',
        });
        this.applyUser(nextUser);
        wx.showToast({ title: t('common.hint.success'), icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.error'), icon: 'none' });
      })
      .finally(() => {
        this.setData({ saving: false });
      });
  },
});
