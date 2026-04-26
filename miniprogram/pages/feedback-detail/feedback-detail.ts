/// <reference path="../../../typings/index.d.ts" />

import { t } from '../../utils/i18n';
import { getFeedbackDetail } from '../../apis/feedback';
import { resolveAssetUrl } from '../../utils/assets';
import { toTimestamp } from '../../utils/time';

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
  statusHint?: string;
  createTime: string;
  latestUpdateTime?: string;
  latestOfficialReply?: string;
  updates?: FeedbackUpdateItem[];
}

interface FeedbackUpdateItem {
  id: string;
  title: string;
  userName: string;
  userRole: string;
  content: string;
  time: string;
  tone: 'status' | 'official' | 'user';
  actorType: 'official' | 'user';
  avatarText: string;
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
    const statusTitleMap: Record<number, string> = {
      1: t('feedback.detail.timelinePending'),
      2: t('feedback.detail.timelineProcessing'),
      3: t('feedback.detail.timelineResolved'),
      4: t('feedback.detail.timelineRejected'),
    };
    const statusHintMap: Record<number, string> = {
      1: t('feedback.detail.timelinePendingText'),
      2: t('feedback.detail.timelineProcessingText'),
      3: t('feedback.detail.timelineResolvedText'),
      4: t('feedback.detail.timelineRejectedText'),
    };

    getFeedbackDetail(id)
      .then((res: any) => {
        const detail = res.data || {};
        const descriptionText = String(
          detail.description || detail.content || detail.remark || ''
        ).trim();
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
        const replyText = detail.reply || '';
        const replyTime =
          detail.replyAt || detail.processedAt || detail.updatedAt || detail.createdAt || '';

        const statusHint = statusHintMap[effectiveStatus] || statusHintMap[1];
        const statusContentByType: Record<number, string> = {
          1: statusHintMap[1],
          2: statusHintMap[2],
          3: detail.reply || detail.processedReason || statusHintMap[3],
          4: detail.processedReason || detail.reply || statusHintMap[4],
        };

        const commentUpdates: FeedbackUpdateItem[] = comments.map(
          (comment: any, index: number) => ({
            id: comment.id || `comment-${index}`,
            title: comment.isOfficial
              ? t('feedback.detail.timelineReply')
              : t('feedback.detail.timelineComment'),
            userName: comment.operator || (comment.isOfficial ? t('feedback.detail.official') : ''),
            userRole: comment.isOfficial ? t('feedback.detail.official') : t('feedback.chat.user'),
            content: comment.content || '',
            time: comment.date || '',
            tone: comment.isOfficial ? 'official' : 'user',
            actorType: comment.isOfficial ? 'official' : 'user',
            avatarText: comment.isOfficial
              ? '官'
              : String(comment.operator || t('feedback.chat.user'))
                  .trim()
                  .slice(0, 1) || '用',
          })
        );

        const statusUpdate: FeedbackUpdateItem = {
          id: `status-${effectiveStatus}`,
          title: statusTitleMap[effectiveStatus] || statusTitleMap[1],
          userName: t('feedback.chat.system'),
          userRole: t('feedback.detail.official'),
          content: statusContentByType[effectiveStatus] || statusHint,
          time: effectiveStatus === 1 ? detail.createdAt || '' : replyTime,
          tone: 'status',
          actorType: 'official',
          avatarText: '官',
        };

        const officialReplyUpdate: FeedbackUpdateItem | null = replyText
          ? {
              id: 'official-reply',
              title: t('feedback.detail.officialReplyTitle'),
              userName: t('feedback.chat.system'),
              userRole: t('feedback.detail.official'),
              content: replyText,
              time: replyTime,
              tone: 'official',
              actorType: 'official',
              avatarText: '官',
            }
          : null;

        const updates = [statusUpdate, officialReplyUpdate, ...commentUpdates]
          .filter(Boolean)
          .filter((item: any, index: number, arr: any[]) => {
            return (
              arr.findIndex(
                (current: any) =>
                  current.title === item.title &&
                  current.content === item.content &&
                  current.time === item.time
              ) === index
            );
          })
          .sort((a: any, b: any) => {
            const ta = toTimestamp(a.time) || 0;
            const tb = toTimestamp(b.time) || 0;
            return ta - tb;
          });

        const latestOfficialReply =
          updates.find((item: FeedbackUpdateItem) => item.tone !== 'user')?.content || '';

        const feedback: FeedbackInfo = {
          id: detail.id,
          title: detail.title,
          description: descriptionText || '-',
          contact: detail.contact || '',
          typeId: detail.typeId || 'other',
          typeName: type.name,
          typeStyle: type.style,
          urgencyId: String(urgencyId || detail.urgencyId || ''),
          urgencyName: urgency.name,
          urgencyStyle: urgency.style,
          reply: replyText,
          replyAt: replyTime || '',
          status: detail.status || 'pending',
          statusStyle: status.style,
          statusText: status.text,
          statusHint,
          createTime: detail.createdAt || '',
          images: (detail.images || []).map((image: string) => resolveAssetUrl(image)),
          latestUpdateTime:
            updates[updates.length - 1]?.time || detail.updatedAt || detail.createdAt || '',
          latestOfficialReply,
          updates,
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
