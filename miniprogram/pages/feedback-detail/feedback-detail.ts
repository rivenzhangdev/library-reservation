/// <reference path="../../typings/index.d.ts" />

import { t } from '../../utils/i18n';

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
    navTitle: t('feedback.detail.title') || '反馈详情',
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

  /**
   * 更新语言
   */
  updateLanguage() {
    const app = getApp<IAppOption>();
    const languageClass = app.globalData.languageClass || 'lang-zh';
    this.setData({
      navTitle: t('feedback.detail.title') || '反馈详情',
      languageClass,
    });
  },

  /**
   * 加载反馈详情
   */
  loadFeedbackDetail(id: string) {
    console.log('加载反馈详情，ID:', id);

    // TODO: 从服务器加载数据
    // 这里使用示例数据
    const feedback: FeedbackInfo = {
      id: '1',
      title: '希望增加座位续约提醒功能',
      description:
        '建议在预约即将到期前 15 分钟，能够通过 APP 推送通知提醒用户可以进行续约操作，避免忘记续约导致座位被占用。',
      contact: '138****1234',
      typeId: 'suggestion',
      typeName: '功能建议',
      typeStyle: 'primary',
      urgencyId: 'medium',
      urgencyName: '中等',
      urgencyStyle: 'medium',
      status: 'processing',
      statusStyle: 'info',
      statusText: '处理中',
      createTime: '2026-01-08 14:30',
      images: [
        'https://picsum.photos/400/300?random=1',
        'https://picsum.photos/400/300?random=2',
        'https://picsum.photos/400/300?random=3',
        'https://picsum.photos/400/300?random=4',
        'https://picsum.photos/400/300?random=5',
      ],
      processRecords: [
        {
          id: '1',
          userName: '管理员',
          userRole: 'admin',
          content: '感谢您的建议，我们正在评估此功能的可行性，预计会在下个版本中推出。',
          processTime: '2026-01-09 10:20',
        },
      ],
    };

    this.setData({ feedbackInfo: feedback });
  },

  /**
   * 预览图片
   */
  onImagePreview(e: any) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.feedbackInfo.images || [];

    wx.previewImage({
      current: images[index],
      urls: images,
      success: () => {
        console.log('图片预览成功，索引:', index);
      },
    });
  },
});
