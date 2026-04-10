/// <reference path="../../../typings/index.d.ts" />

import { t } from '../../utils/i18n';
import { getFeedbackDetail } from '../../apis/feedback';
import { resolveAssetUrl } from '../../utils/assets';

function formatDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

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
  reply?: string;
  replyAt?: string;
  images?: string[];
  status: string;
  statusStyle: string;
  statusText: string;
  createTime: string;
  processRecords?: ProcessRecord[];
  timelineItems?: TimelineItem[];
}

interface ProcessRecord {
  id: string;
  userName: string;
  userRole: string;
  content: string;
  processTime: string;
}

interface TimelineItem {
  id: string;
  title: string;
  userName: string;
  userRole: string;
  content: string;
  time: string;
  type: 'submit' | 'reply' | 'comment';
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
    const urgencyMap: Record<number, { name: string; style: string }> = {
      1: { name: t('feedback.form.urgency.low'), style: 'low' },
      2: { name: t('feedback.form.urgency.medium'), style: 'medium' },
      3: { name: t('feedback.form.urgency.high'), style: 'high' },
      4: { name: t('feedback.form.urgency.urgent'), style: 'urgent' },
    };

    getFeedbackDetail(id)
      .then((res: any) => {
        const detail = res.data || {};
        const rawStatus = Number(detail.status) || 1;
        const effectiveStatus =
          rawStatus === 1 && Array.isArray(detail.comments) && detail.comments.length > 0
            ? 2
            : rawStatus;
        const status = statusMap[effectiveStatus] || statusMap[1];
        const type = typeMap[Number(detail.typeId)] || typeMap[4];
        const urgencyId = Number(detail.urgencyId || detail.urgency || 0);
        const urgency = urgencyMap[urgencyId] || {
          name: detail.urgencyName || '',
          style: detail.urgencyStyle || '',
        };

        const comments = Array.isArray(detail.comments) ? detail.comments : [];
        const officialComments = comments.filter((comment: any) => comment.isOfficial);
        const latestOfficialComment = officialComments.slice().sort((a: any, b: any) => {
          const ta = new Date(a.date).getTime() || 0;
          const tb = new Date(b.date).getTime() || 0;
          return tb - ta;
        })[0];

        const replyText = detail.reply || latestOfficialComment?.content || '';
        const replyTime =
          detail.replyAt ||
          latestOfficialComment?.date ||
          detail.updatedAt ||
          detail.createdAt ||
          '';

        const processRecords = comments.map((comment: any) => ({
          id: comment._id || `${comment.operator}-${comment.date || Math.random()}`,
          userName: comment.operator || '',
          userRole: comment.isOfficial ? t('feedback.detail.official') : '',
          content: comment.content,
          processTime: comment.date ? new Date(comment.date).toLocaleString() : '',
        }));

        const timelineItems: TimelineItem[] = [
          {
            id: detail._id || detail.id || 'initial',
            title: t('feedback.detail.timelineSubmitted'),
            userName: '',
            userRole: '',
            content: detail.description || '',
            time: detail.createdAt ? formatDateTime(detail.createdAt) : '',
            type: 'submit',
          },
          ...comments.map((comment: any, index: number) => ({
            id: comment._id || `comment-${index}`,
            title: comment.isOfficial
              ? t('feedback.detail.timelineReply')
              : t('feedback.detail.timelineComment'),
            userName: comment.isOfficial ? comment.operator || t('feedback.detail.official') : '',
            userRole: comment.isOfficial ? t('feedback.detail.official') : '',
            content: comment.content || '',
            time: comment.date ? formatDateTime(comment.date) : '',
            type: comment.isOfficial ? 'reply' : 'comment',
          })),
        ];

        const feedback: FeedbackInfo = {
          id: detail._id || detail.id,
          title: detail.title,
          description: detail.description,
          contact: detail.contact || '',
          typeId: detail.typeId || 'other',
          typeName: type.name,
          typeStyle: type.style,
          urgencyId: String(urgencyId || detail.urgencyId || ''),
          urgencyName: urgency.name,
          urgencyStyle: urgency.style,
          reply: replyText,
          replyAt: replyTime ? formatDateTime(replyTime) : '',
          status: detail.status || 'pending',
          statusStyle: status.style,
          statusText: status.text,
          createTime: detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '',
          images: (detail.images || []).map((image: string) => resolveAssetUrl(image)),
          processRecords,
          timelineItems,
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
