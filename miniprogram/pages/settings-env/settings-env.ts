import { t } from '../../utils/i18n';
import config from '../../config/index';

Page({
  data: {
    pageTitle: '',
    envs: [] as any[],
    currentBase: '',
  },

  onLoad() {
    if (config.isCurrentBackendEnvProd()) {
      wx.showToast({ title: t('common.hint.noPermission') || 'No permission', icon: 'none' });
      wx.navigateBack({ delta: 1 });
      return;
    }

    this.setData({
      pageTitle: t('settings.env.title') || 'Environment',
      envs: config.BACKEND_ENVS,
      currentBase: config.getBaseUrl(),
    });
  },

  onShow() {
    this.setData({ currentBase: config.getBaseUrl() });
  },

  onEnvTap(e: WechatMiniprogram.CustomEvent) {
    const key = e.currentTarget.dataset.key as string;
    const found = (config.BACKEND_ENVS as any[]).find((x) => x.key === key);
    if (found) {
      config.setBaseUrl(found.baseUrl);
      this.setData({ currentBase: found.baseUrl });
      wx.showToast({ title: t('settings.env.setSuccess') || 'Saved', icon: 'success' });
    }
  },
});
