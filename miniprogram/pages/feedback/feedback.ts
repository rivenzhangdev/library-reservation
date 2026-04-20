/// <reference path="../../../typings/index.d.ts" />

import { getMyFeedbacks, submitFeedback as submitFeedbackApi } from '../../apis/feedback';
import { uploadDataUrl } from '../../apis/upload';
import { readLocalImageAsDataUrl } from '../../utils/file';
import { t } from '../../utils/i18n';

interface FeedbackType {
  id: string;
  name: string;
  typeStyle: string;
}

interface UrgencyLevel {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface FeedbackRecord {
  id: string;
  title: string;
  description: string;
  contact: string;
  typeId: string;
  typeName: string;
  typeStyle: string;
  urgencyId?: string;
  urgencyName?: string;
  urgencyStyle?: string;
  images?: string[];
  status: string;
  statusStyle: string;
  statusText: string;
  createTime: string;
  commentsCount?: number;
}

const TYPE_MAP: Record<number, { id: string; style: string }> = {
  1: { id: 'suggestion', style: 'primary' },
  2: { id: 'bug', style: 'danger' },
  3: { id: 'complaint', style: 'warning' },
  4: { id: 'other', style: 'default' },
};

const URGENCY_MAP: Record<number, { id: string; style: string }> = {
  1: { id: 'low', style: 'low' },
  2: { id: 'medium', style: 'medium' },
  3: { id: 'high', style: 'high' },
  4: { id: 'urgent', style: 'urgent' },
};

const FEEDBACK_TYPE_REVERSE_MAP: Record<string, number> = {
  suggestion: 1,
  bug: 2,
  complaint: 3,
  other: 4,
};

const URGENCY_LEVEL_REVERSE_MAP: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

const STATUS_MAP: Record<number, { style: string; textKey: string }> = {
  1: { style: 'warning', textKey: 'feedback.status.pending' },
  2: { style: 'primary', textKey: 'feedback.status.processing' },
  3: { style: 'success', textKey: 'feedback.status.resolved' },
  4: { style: 'danger', textKey: 'feedback.status.rejected' },
};

Page({
  data: {
    navTitle: '',
    languageClass: '',
    currentTab: 'submit',
    submitTabText: '',
    recordsTabText: '',
    typeTitle: '',
    titleLabel: '',
    titlePlaceholder: '',
    descriptionLabel: '',
    descriptionPlaceholder: '',
    urgencyLabel: '',
    imageLabel: '',
    imageOptionalText: '',
    imageUploadText: '',
    contactLabel: '',
    contactOptionalText: '',
    contactPlaceholder: '',
    submitButtonText: '',
    emptyText: '',
    detailTypeText: '',
    detailSubmitTimeText: '',
    detailUrgencyText: '',
    chatUserLabel: '',
    chatSystemLabel: '',
    feedbackTypes: [] as FeedbackType[],
    urgencyLevels: [] as UrgencyLevel[],
    selectedType: '',
    selectedUrgency: '',
    title: '',
    description: '',
    contact: '',
    uploadedImages: [] as string[],
    maxImageCount: 9,
    feedbackRecords: [] as FeedbackRecord[],
  },

  onLoad() {
    this.updateLanguage();
    this.loadFeedbackRecords();
  },

  onShow() {
    this.updateLanguage();
    if (this.data.currentTab === 'records') {
      this.loadFeedbackRecords();
    }
  },

  updateLanguage() {
    const app = getApp<IAppOption>();
    const languageClass = app.globalData.languageClass || 'lang-zh';

    this.setData({
      navTitle: t('feedback.title'),
      languageClass,
      submitTabText: t('feedback.tab.submit'),
      recordsTabText: t('feedback.tab.records'),
      typeTitle: t('feedback.form.type'),
      titleLabel: t('feedback.form.title'),
      titlePlaceholder: t('feedback.form.title.placeholder'),
      descriptionLabel: t('feedback.form.description'),
      descriptionPlaceholder: t('feedback.form.description.placeholder'),
      urgencyLabel: t('feedback.form.urgency'),
      imageLabel: t('feedback.form.images'),
      imageOptionalText: t('feedback.form.images.optional'),
      imageUploadText: t('feedback.form.images.upload'),
      contactLabel: t('feedback.form.contact'),
      contactOptionalText: t('feedback.form.contact.optional'),
      contactPlaceholder: t('feedback.form.contact.placeholder'),
      submitButtonText: t('feedback.form.submit'),
      emptyText: t('feedback.records.empty'),
      detailTypeText: t('feedback.detail.type'),
      detailSubmitTimeText: t('feedback.detail.submitTime'),
      detailUrgencyText: t('feedback.detail.urgency'),
      chatUserLabel: t('feedback.chat.user'),
      chatSystemLabel: t('feedback.chat.system'),
      feedbackTypes: [
        {
          id: 'suggestion',
          name: t('feedback.form.type.suggestion'),
          typeStyle: 'primary',
        },
        {
          id: 'bug',
          name: t('feedback.form.type.bug'),
          typeStyle: 'danger',
        },
        {
          id: 'complaint',
          name: t('feedback.form.type.complaint'),
          typeStyle: 'warning',
        },
        {
          id: 'other',
          name: t('feedback.form.type.other'),
          typeStyle: 'default',
        },
      ],
      urgencyLevels: [
        {
          id: 'low',
          name: t('feedback.form.urgency.low'),
          icon: 'flag-o',
          color: '#52c41a',
        },
        {
          id: 'medium',
          name: t('feedback.form.urgency.medium'),
          icon: 'flag-o',
          color: '#faad14',
        },
        {
          id: 'high',
          name: t('feedback.form.urgency.high'),
          icon: 'fire-o',
          color: '#f5222d',
        },
        {
          id: 'urgent',
          name: t('feedback.form.urgency.urgent'),
          icon: 'warning-o',
          color: '#722ed1',
        },
      ],
    });
  },

  async loadFeedbackRecords() {
    try {
      const res: any = await getMyFeedbacks({
        page: 1,
        limit: 20,
      });
      const raw = res?.data || {};
      const list = Array.isArray(raw.list) ? raw.list : [];

      const feedbackRecords: FeedbackRecord[] = list.map((record: any) => {
        const typeMeta = TYPE_MAP[Number(record.typeId)] || TYPE_MAP[4];
        const urgencyMeta = record.urgencyId ? URGENCY_MAP[Number(record.urgencyId)] : undefined;
        const rawStatus = Number(record.status) || 1;
        const effectiveStatus = rawStatus === 1 && Number(record.commentsCount) > 0 ? 2 : rawStatus;
        const statusMeta = STATUS_MAP[effectiveStatus] || STATUS_MAP[1];
        const typeName =
          this.data.feedbackTypes.find((item) => item.id === typeMeta.id)?.name ||
          t(`feedback.form.type.${typeMeta.id}`);
        const urgencyName = urgencyMeta
          ? this.data.urgencyLevels.find((item) => item.id === urgencyMeta.id)?.name ||
            t(`feedback.form.urgency.${urgencyMeta.id}`)
          : '';

        return {
          id: String(record.id),
          title: record.title || '-',
          description: record.description || '',
          contact: record.contact || '',
          typeId: typeMeta.id,
          typeName,
          typeStyle: typeMeta.style,
          urgencyId: urgencyMeta?.id,
          urgencyName,
          urgencyStyle: urgencyMeta?.style,
          images: Array.isArray(record.images) ? record.images : [],
          status: String(record.status || ''),
          statusStyle: statusMeta.style,
          statusText: t(statusMeta.textKey),
          createTime: record.createdAt || '',
          commentsCount: Number(record.commentsCount) || 0,
        };
      });

      this.setData({ feedbackRecords });
    } catch (_error) {
      this.setData({ feedbackRecords: [] });
    }
  },

  onRecordTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id?: string };
    if (!id) return;

    wx.navigateTo({
      url: `/pages/feedback-detail/feedback-detail?id=${id}`,
    });
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const { tab } = e.currentTarget.dataset as { tab?: string };
    if (!tab) return;

    this.setData({ currentTab: tab });
    if (tab === 'records') {
      this.loadFeedbackRecords();
    }
  },

  onTypeTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id?: string };
    this.setData({ selectedType: id || '' });
  },

  onUrgencyTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id?: string };
    this.setData({ selectedUrgency: id || '' });
  },

  onTitleChange(e: WechatMiniprogram.CustomEvent) {
    const value = String((e.detail as any)?.value ?? e.detail ?? '');
    this.setData({ title: value });
  },

  onDescriptionChange(e: WechatMiniprogram.CustomEvent) {
    const value = String((e.detail as any)?.value ?? e.detail ?? '');
    this.setData({ description: value });
  },

  onContactChange(e: WechatMiniprogram.CustomEvent) {
    const value = String((e.detail as any)?.value ?? e.detail ?? '');
    this.setData({ contact: value });
  },

  async onImageUpload() {
    const { uploadedImages, maxImageCount } = this.data;
    const remaining = maxImageCount - uploadedImages.length;
    if (remaining <= 0) return;

    try {
      const chooseRes = await new Promise<WechatMiniprogram.ChooseImageSuccessCallbackResult>(
        (resolve, reject) => {
          wx.chooseImage({
            count: remaining,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: reject,
          });
        }
      );

      const urls: string[] = [];
      for (const filePath of chooseRes.tempFilePaths) {
        const dataUrl = await readLocalImageAsDataUrl(filePath);
        const uploadRes: any = await uploadDataUrl(dataUrl);
        const url = uploadRes?.data?.url;
        if (!url || typeof url !== 'string') {
          throw new Error('Upload response did not return data.url');
        }
        urls.push(url);
      }

      this.setData({
        uploadedImages: [...uploadedImages, ...urls],
      });
    } catch (_error) {
      wx.showToast({
        title: t('feedback.toast.submitFailed'),
        icon: 'none',
      });
    }
  },

  onImageDelete(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset as { index?: number };
    const uploadedImages = this.data.uploadedImages.filter((_, itemIndex) => itemIndex !== index);
    this.setData({ uploadedImages });
  },

  onImagePreview(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset as { index?: number };
    const images = this.data.uploadedImages;
    if (index === undefined || !images[index]) return;

    wx.previewImage({
      current: images[index],
      urls: images,
    });
  },

  onSubmitTap() {
    const { selectedType, selectedUrgency, title, description } = this.data;

    if (!selectedType) {
      wx.showToast({ title: t('feedback.toast.selectType'), icon: 'none' });
      return;
    }

    if (!selectedUrgency) {
      wx.showToast({ title: t('feedback.toast.selectUrgency'), icon: 'none' });
      return;
    }

    if (!String(title || '').trim()) {
      wx.showToast({ title: t('feedback.toast.fillTitle'), icon: 'none' });
      return;
    }

    if (!String(description || '').trim()) {
      wx.showToast({
        title: t('feedback.toast.fillDescription'),
        icon: 'none',
      });
      return;
    }

    wx.showModal({
      title: t('feedback.form.submit'),
      content: t('feedback.toast.confirmSubmit'),
      success: (res) => {
        if (!res.confirm) return;
        this.submitFeedback();
      },
    });
  },

  async submitFeedback() {
    const { selectedType, selectedUrgency, title, description, contact, uploadedImages } =
      this.data;

    const typeId = FEEDBACK_TYPE_REVERSE_MAP[selectedType] || 4;
    const urgencyId = URGENCY_LEVEL_REVERSE_MAP[selectedUrgency];
    if (!urgencyId) {
      wx.showToast({ title: t('feedback.toast.selectUrgency'), icon: 'none' });
      return;
    }

    try {
      await submitFeedbackApi({
        typeId,
        urgencyId,
        title: String(title || '').trim(),
        description: String(description || '').trim(),
        contact: String(contact || '').trim(),
        images: uploadedImages,
      });

      wx.showToast({
        title: t('feedback.toast.submitSuccess'),
        icon: 'success',
      });

      this.setData({
        selectedType: '',
        selectedUrgency: '',
        title: '',
        description: '',
        contact: '',
        uploadedImages: [],
      });

      setTimeout(() => {
        this.setData({ currentTab: 'records' });
        this.loadFeedbackRecords();
      }, 1200);
    } catch (_error) {
      wx.showToast({
        title: t('feedback.toast.submitFailed'),
        icon: 'none',
      });
    }
  },
});
