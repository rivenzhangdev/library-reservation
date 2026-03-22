/// <reference path="../../typings/index.d.ts" />

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
}

Page({
  data: {
    navTitle: t('feedback.title') || '问题反馈',
    languageClass: '',
    currentTab: 'submit', // 'submit' | 'records'

    // 反馈类型
    feedbackTypes: [
      { id: 'suggestion', name: '功能建议', typeStyle: 'primary' },
      { id: 'bug', name: '问题上报', typeStyle: 'danger' },
      { id: 'complaint', name: '投诉建议', typeStyle: 'warning' },
      { id: 'other', name: '其他', typeStyle: 'default' },
    ] as FeedbackType[],

    // 紧急程度
    urgencyLevels: [
      { id: 'low', name: '低', icon: '🌱', color: '#52c41a' },
      { id: 'medium', name: '中', icon: '⚠️', color: '#faad14' },
      { id: 'high', name: '高', icon: '🔥', color: '#f5222d' },
      { id: 'urgent', name: '紧急', icon: '🚨', color: '#722ed1' },
    ] as UrgencyLevel[],

    // 选中的类型
    selectedType: '',
    selectedUrgency: '',

    // 表单数据
    title: '',
    description: '',
    contact: '',

    // 图片上传
    uploadedImages: [] as string[],
    maxImageCount: 9,

    // 反馈记录
    feedbackRecords: [] as FeedbackRecord[],
  },

  onLoad() {
    this.updateLanguage();
    this.initFeedbackRecords();
  },

  /**
   * 更新语言
   */
  updateLanguage() {
    const app = getApp<IAppOption>();
    const languageClass = app.globalData.languageClass || 'lang-zh';
    this.setData({
      navTitle: t('feedback.title') || '问题反馈',
      languageClass,
    });
  },

  /**
   * 初始化反馈记录
   */
  initFeedbackRecords() {
    // TODO: 从服务器加载反馈记录
    // 这里使用示例数据
    const records: FeedbackRecord[] = [
      {
        id: '1',
        title: '希望增加座位续约提醒功能',
        description:
          '建议在预约即将到期前 15 分钟，能够通过 APP 推送通知提醒用户可以进行续约操作，避免忘记续约导致座位被占用。',
        contact: '138****1234',
        typeId: 'suggestion',
        typeName: '功能建议',
        typeStyle: 'primary',
        urgencyId: 'medium',
        urgencyName: '中',
        urgencyStyle: 'medium',
        status: 'processing',
        statusStyle: 'primary',
        statusText: '处理中',
        createTime: '2026-01-08',
      },
      {
        id: '2',
        title: '预约页面加载缓慢',
        description: '在高峰期打开预约页面需要等待很长时间，希望能优化加载速度。',
        contact: '',
        typeId: 'bug',
        typeName: '问题上报',
        typeStyle: 'danger',
        urgencyId: 'high',
        urgencyName: '高',
        urgencyStyle: 'high',
        status: 'resolved',
        statusStyle: 'success',
        statusText: '已解决',
        createTime: '2026-01-01',
      },
      {
        id: '3',
        title: '部分座位插座无法使用',
        description: 'A 区 3 楼靠窗座位的电源插座有多个损坏，无法正常使用，请安排维修。',
        contact: '139****5678',
        typeId: 'complaint',
        typeName: '投诉建议',
        typeStyle: 'warning',
        urgencyId: 'urgent',
        urgencyName: '紧急',
        urgencyStyle: 'urgent',
        status: 'pending',
        statusStyle: 'warning',
        statusText: '待处理',
        createTime: '2025-12-25',
      },
    ];

    this.setData({ feedbackRecords: records });
  },

  /**
   * 点击反馈记录
   */
  onRecordTap(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/feedback-detail/feedback-detail?id=${id}`,
      success: () => {
        console.log('跳转到反馈详情页');
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
        });
      },
    });
  },

  /**
   * Tab 切换
   */
  onTabTap(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });

    if (tab === 'records') {
      this.initFeedbackRecords();
    }
  },

  /**
   * 选择反馈类型
   */
  onTypeTap(e: any) {
    const typeId = e.currentTarget.dataset.id;
    this.setData({ selectedType: typeId });
  },

  /**
   * 选择紧急程度
   */
  onUrgencyTap(e: any) {
    const urgencyId = e.currentTarget.dataset.id;
    this.setData({ selectedUrgency: urgencyId });
  },

  /**
   * 标题输入变化
   */
  onTitleChange(e: any) {
    this.setData({ title: e.detail });
  },

  /**
   * 描述输入变化
   */
  onDescriptionChange(e: any) {
    this.setData({ description: e.detail });
  },

  /**
   * 联系方式输入变化
   */
  onContactChange(e: any) {
    this.setData({ contact: e.detail });
  },

  /**
   * 上传图片
   */
  onImageUpload() {
    const { uploadedImages, maxImageCount } = this.data;
    const remaining = maxImageCount - uploadedImages.length;

    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        const newImages = [...uploadedImages, ...tempFilePaths];
        this.setData({ uploadedImages: newImages });

        // TODO: 上传图片到服务器
        console.log('上传图片:', tempFilePaths);
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '图片选择失败',
          icon: 'none',
        });
      },
    });
  },

  /**
   * 删除图片
   */
  onImageDelete(e: any) {
    const index = e.currentTarget.dataset.index;
    const uploadedImages = this.data.uploadedImages.filter((_, idx) => idx !== index);
    this.setData({ uploadedImages });
  },

  /**
   * 预览图片
   */
  onImagePreview(e: any) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.uploadedImages[index],
      urls: this.data.uploadedImages,
    });
  },

  /**
   * 提交反馈
   */
  onSubmitTap() {
    const { selectedType, title, description } = this.data;

    // 验证必填项
    if (!selectedType) {
      wx.showToast({
        title: '请选择反馈类型',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    if (!title || !title.trim()) {
      wx.showToast({
        title: '请填写问题标题',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    if (!description || !description.trim()) {
      wx.showToast({
        title: '请填写详细描述',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    // 显示确认对话框
    wx.showModal({
      title: '确认提交',
      content: '确认要提交这条反馈吗？',
      success: (res) => {
        if (res.confirm) {
          this.submitFeedback();
        }
      },
    });
  },

  /**
   * 提交反馈到服务器
   */
  submitFeedback() {
    const { selectedType, selectedUrgency, title, description, contact, uploadedImages } =
      this.data;

    // TODO: 调用服务器接口提交反馈
    console.log('提交反馈:', {
      typeId: selectedType,
      urgencyId: selectedUrgency,
      title,
      description,
      contact,
      images: uploadedImages,
    });

    // 模拟提交成功
    wx.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 2000,
      success: () => {
        // 清空表单
        this.setData({
          selectedType: '',
          selectedUrgency: '',
          title: '',
          description: '',
          contact: '',
          uploadedImages: [],
        });

        // 切换到记录 Tab
        setTimeout(() => {
          this.setData({ currentTab: 'records' });
          this.initFeedbackRecords();
        }, 1500);
      },
    });
  },
});
