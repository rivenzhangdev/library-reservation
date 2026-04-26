import { t } from '../../utils/i18n';
import { getWechatTemplateIds } from '../../apis/notification';
import { getSettings, updateSettings } from '../../apis/user';
import { isLogin, redirectToLogin } from '../../utils/auth';

type NotificationSettings = {
  bookingSuccess: boolean;
  systemNotice: boolean;
};

type DoNotDisturbSettings = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type UserSettings = {
  notifications: NotificationSettings;
  doNotDisturb: DoNotDisturbSettings;
  privacy: {
    shareLocation: boolean;
    shareUsageData: boolean;
    publicProfile: boolean;
  };
};

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    bookingSuccess: true,
    systemNotice: true,
  },
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
  privacy: {
    shareLocation: false,
    shareUsageData: false,
    publicProfile: false,
  },
};

function mergeSettings(remote: any): UserSettings {
  const settings = remote || {};
  const notifications = settings.notifications || {};
  const doNotDisturb = settings.doNotDisturb || {};
  const privacy = settings.privacy || {};

  return {
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...notifications,
    },
    doNotDisturb: {
      ...DEFAULT_SETTINGS.doNotDisturb,
      ...doNotDisturb,
    },
    privacy: {
      ...DEFAULT_SETTINGS.privacy,
      ...privacy,
    },
  };
}

function requestSubscribeMessage(templateIds: string[]): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    wx.requestSubscribeMessage({
      tmplIds: templateIds,
      success: (res) => resolve(res as Record<string, string>),
      fail: reject,
    });
  });
}

Page({
  data: {
    navTitle: '',
    introTitle: '',
    introDesc: '',
    subscribeButtonText: '',
    sceneSectionTitle: '',
    dndSectionTitle: '',
    dndTips: '',
    saveText: '',

    bookingSuccessLabel: '',
    systemNoticeLabel: '',

    dndEnabledLabel: '',
    dndStartLabel: '',
    dndEndLabel: '',

    settings: DEFAULT_SETTINGS as UserSettings,
    saving: false,
  },

  _serverSettings: {} as Record<string, any>,

  onLoad() {
    this.updateLocaleText();
    this.loadSettings();
  },

  onShow() {
    this.updateLocaleText();
  },

  updateLocaleText() {
    this.setData({
      navTitle: t('notification.settings.title'),
      introTitle: t('notification.settings.introTitle'),
      introDesc: t('notification.settings.introDesc'),
      subscribeButtonText: t('notification.settings.subscribeButton'),
      sceneSectionTitle: t('notification.settings.sceneSectionTitle'),
      dndSectionTitle: t('notification.settings.dndSectionTitle'),
      dndTips: t('notification.settings.dndTips'),
      saveText: t('notification.settings.save'),

      bookingSuccessLabel: t('notification.settings.scene.bookingSuccess'),
      systemNoticeLabel: t('notification.settings.scene.systemNotice'),

      dndEnabledLabel: t('notification.settings.dnd.enabled'),
      dndStartLabel: t('notification.settings.dnd.startTime'),
      dndEndLabel: t('notification.settings.dnd.endTime'),
    });
  },

  async loadSettings() {
    if (!isLogin()) {
      redirectToLogin('/pages/notification-settings/notification-settings');
      return;
    }

    try {
      const res = await getSettings();
      (this as any)._serverSettings = (res.data || {}) as Record<string, any>;
      const merged = mergeSettings(res.data);
      this.setData({ settings: merged });
    } catch (error) {
      console.error('Failed to load notification settings', error);
      wx.showToast({ title: t('common.hint.error'), icon: 'none' });
    }
  },

  onToggleNotification(event: WechatMiniprogram.CustomEvent) {
    const key = String(event.currentTarget.dataset.key || '');
    const value = !!event.detail?.value;
    if (!key) return;

    const settings = this.data.settings;
    this.setData({
      settings: {
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: value,
        },
      },
    });
  },

  onToggleDnd(event: WechatMiniprogram.CustomEvent) {
    const value = !!event.detail?.value;
    const settings = this.data.settings;
    this.setData({
      settings: {
        ...settings,
        doNotDisturb: {
          ...settings.doNotDisturb,
          enabled: value,
        },
      },
    });
  },

  onStartTimeChange(event: WechatMiniprogram.CustomEvent) {
    const value = String(event.detail.value || '22:00');
    const settings = this.data.settings;
    this.setData({
      settings: {
        ...settings,
        doNotDisturb: {
          ...settings.doNotDisturb,
          startTime: value,
        },
      },
    });
  },

  onEndTimeChange(event: WechatMiniprogram.CustomEvent) {
    const value = String(event.detail.value || '08:00');
    const settings = this.data.settings;
    this.setData({
      settings: {
        ...settings,
        doNotDisturb: {
          ...settings.doNotDisturb,
          endTime: value,
        },
      },
    });
  },

  async onSaveTap() {
    if (this.data.saving) return;

    this.setData({ saving: true });
    try {
      const serverSettings = (this as any)._serverSettings || {};
      const payload = {
        ...serverSettings,
        notifications: {
          ...(serverSettings.notifications || {}),
          ...this.data.settings.notifications,
        },
        doNotDisturb: {
          ...(serverSettings.doNotDisturb || {}),
          ...this.data.settings.doNotDisturb,
        },
        privacy: {
          ...(serverSettings.privacy || {}),
          ...this.data.settings.privacy,
        },
      };

      await updateSettings(payload);
      (this as any)._serverSettings = payload;
      wx.showToast({
        title: t('common.toast.saveSuccess'),
        icon: 'success',
      });
    } catch (error) {
      console.error('Failed to save notification settings', error);
      wx.showToast({
        title: t('common.toast.saveFailed'),
        icon: 'none',
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onSubscribeAuthorizeTap() {
    try {
      const templateRes = await getWechatTemplateIds();
      const data = (templateRes.data || {}) as Record<string, string>;
      const templateIds = [data.BOOKING_SUCCESS].filter(
        (id) => typeof id === 'string' && id.trim().length > 0
      );

      if (templateIds.length === 0) {
        wx.showToast({
          title: t('notification.settings.toast.noTemplate'),
          icon: 'none',
        });
        return;
      }

      const result = await requestSubscribeMessage(templateIds);
      const accepted = Object.values(result).some((status) => status === 'accept');

      wx.showToast({
        title: accepted
          ? t('notification.settings.toast.subscribeAccepted')
          : t('notification.settings.toast.subscribeDeclined'),
        icon: accepted ? 'success' : 'none',
      });
    } catch (error) {
      console.error('Failed to request subscribe message', error);
      wx.showToast({
        title: t('notification.settings.toast.subscribeFailed'),
        icon: 'none',
      });
    }
  },
});
