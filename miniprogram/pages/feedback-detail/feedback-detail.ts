/// <reference path="../../../typings/index.d.ts" />

import { t } from '../../utils/i18n';
import { getFeedbackDetail } from '../../apis/feedback';
import { resolveAssetUrl } from '../../utils/assets';

interface FeedbackInfo {
  id: string;
  title: string;
  description: string;
  contact: string;
  typeId: string;
  typeName: string;
  typeStyle: string;
  urgencyId: string;
  urgencyName: string;
  urgencyStyle: string;
  images?: string[];
  status: string;
  statusStyle: string;
  statusText: string;
  createTime: string;
  processRecords?: ProcessRecord[];
}

interface ProcessRecord {
  id: string;
  userName: string;
  userRole: string;
  content: string;
  processTime: string;
}

Page({
  data: {
    navTitle: '',
    languageClass: '',
    feedbackId: '',
    feedbackInfo: {} as FeedbackInfo,
  },

  onLoad(options: any) {
    this.updateLanguage();
    if (options.id) {
      this.setData({ feedbackId: options.id });
      this.loadFeedbackDetail(options.id);
    }
  },

  updateLanguage() {
    const languageClass = getApp<IAppOption>().globalData.languageClass || 'lang-zh';
    this.setData({
      navTitle: t('feedback.detail.title'),
      languageClass,
    });
  },

  loadFeedbackDetail(id: string) {
    const statusMap: Record<number, { style: string; text: string }> = {
      1: { style: 'warning', text: t('feedback.status.pending') },
      2: { style: 'primary', text: t('feedback.status.processing') },
      3: { style: 'success', text: t('feedback.status.resolved') },
      4: { style: 'danger', text: t('feedback.status.rejected') },
    };
    const typeMap: Record<number, { name: string; style: string }> = {
      1: { name: t('feedback.form.type.suggestion'), style: 'primary' },
      2: { name: t('feedback.form.type.bug'), style: 'danger' },
      3: { name: t('feedback.form.type.complaint'), style: 'warning' },
      4: { name: t('feedback.form.type.other'), style: 'default' },
    };

    getFeedbackDetail(id)
      .then((res: any) => {
        const detail = res.data || {};
        const status = statusMap[detail.status] || statusMap[1];
        const type = typeMap[detail.typeId] || typeMap[4];

        const feedback: FeedbackInfo = {
          id: detail._id || detail.id,
          title: detail.title,
          description: detail.description,
          contact: detail.contact || '',
          typeId: detail.typeId || 'other',
          typeName: type.name,
          typeStyle: type.style,
          urgencyId: detail.urgencyId || '',
          urgencyName: detail.urgencyName || '',
          urgencyStyle: detail.urgencyId || '',
          status: detail.status || 'pending',
          statusStyle: status.style,
          statusText: status.text,
          createTime: detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '',
          images: (detail.images || []).map((image: string) => resolveAssetUrl(image)),
          processRecords: detail.processRecords || [],
        };

        this.setData({ feedbackInfo: feedback });
      })
      .catch(() => {
        wx.showToast({ title: t('common.hint.loadFailed'), icon: 'none' });
      });
  },

  onImagePreview(e: any) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.feedbackInfo.images || [];
    wx.previewImage({
      current: images[index],
      urls: images,
    });
  },
});
