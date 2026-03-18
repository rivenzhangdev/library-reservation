import { t } from '../../utils/i18n';

interface NotificationItem {
  id: number;
  type: 'reservation' | 'system' | 'activity';
  icon: string;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentLang: 'zh',
    languageClass: 'lang-zh',
    // 页面标题
    pageTitle: '',
    // 全部已读文案
    markAllReadText: '',
    // 标记已读文案
    markReadText: '',
    // 查看详请文案
    viewDetailText: '',
    // 已读/未读文案
    readText: '',
    unreadText: '',
    // 空状态文案
    emptyText: '',
    // 是否有未读消息
    hasUnread: false,
    // 当前筛选
    currentFilter: 'all',
    // 筛选标签
    filterTabs: [
      { label: '全部', value: 'all' },
      { label: '未读', value: 'unread' },
      { label: '系统通知', value: 'system' },
      { label: '活动通知', value: 'activity' },
      { label: '预约通知', value: 'reservation' },
    ],
    // 通知列表
    notificationList: [] as NotificationItem[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.initPageData();
    this.updateLanguage();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.updateLanguage();
  },

  /**
   * 初始化页面数据
   */
  initPageData() {
    // 模拟通知数据 - 使用有效的 Vant 图标
    const mockNotifications: NotificationItem[] = [
      {
        id: 1,
        type: 'reservation',
        icon: 'success', // 预约成功 - 对勾图标
        title: '预约成功通知',
        content: '您已成功预约 A 区 2 楼靠窗座位，预约时间为今天 14:00-16:00，请按时签到。',
        time: '10 分钟前',
        isRead: false,
      },
      {
        id: 2,
        type: 'system',
        icon: 'warning-o', // 系统通知 - 警告图标
        title: '系统维护通知',
        content: '图书馆系统将于本周日凌晨 2:00-4:00 进行维护，期间可能无法正常使用预约功能。',
        time: '2 小时前',
        isRead: false,
      },
      {
        id: 3,
        type: 'activity',
        icon: 'gift-o', // 活动通知 - 礼物图标
        title: '活动开始通知',
        content: '您报名的"阅读马拉松挑战赛"将于明天开始，请做好准备。',
        time: '昨天',
        isRead: true,
      },
    ];

    this.setData({
      notificationList: mockNotifications,
      hasUnread: mockNotifications.some((item) => !item.isRead),
    });
  },

  /**
   * 更新页面语言
   */
  updateLanguage() {
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      const currentLang = app.globalData.currentLang || 'zh';
      const isZh = currentLang === 'zh';

      this.setData({
        currentLang,
        languageClass: isZh ? 'lang-zh' : 'lang-en',
        pageTitle: t('notification.pageTitle'),
        markAllReadText: t('notification.markAllRead'),
        markReadText: t('notification.markRead'),
        viewDetailText: t('notification.viewDetail'),
        readText: t('notification.read'),
        unreadText: t('notification.unread'),
        emptyText: t('notification.empty'),
        // 更新筛选标签
        filterTabs: [
          {
            label: isZh ? '全部' : 'All',
            value: 'all',
          },
          {
            label: isZh ? '未读' : 'Unread',
            value: 'unread',
          },
          {
            label: isZh ? '系统通知' : 'System',
            value: 'system',
          },
          {
            label: isZh ? '活动通知' : 'Activity',
            value: 'activity',
          },
          {
            label: isZh ? '预约通知' : 'Reservation',
            value: 'reservation',
          },
        ],
      });
    }
  },

  /**
   * 筛选标签切换
   */
  onFilterChange(event: WechatMiniprogram.CustomEvent) {
    const index = event.detail.index as number;
    const selectedTab = this.data.filterTabs[index];

    if (selectedTab) {
      this.setData({
        currentFilter: selectedTab.value,
      });

      // 根据筛选条件过滤通知
      let filteredList = this.data.notificationList;

      if (selectedTab.value === 'unread') {
        filteredList = this.data.notificationList.filter((item) => !item.isRead);
      } else if (selectedTab.value === 'reservation') {
        filteredList = this.data.notificationList.filter((item) => item.type === 'reservation');
      } else if (selectedTab.value === 'system') {
        filteredList = this.data.notificationList.filter((item) => item.type === 'system');
      } else if (selectedTab.value === 'activity') {
        filteredList = this.data.notificationList.filter((item) => item.type === 'activity');
      }

      this.setData({
        notificationList: filteredList,
        hasUnread: filteredList.some((item) => !item.isRead),
      });
    }
  },

  /**
   * 卡片点击
   */
  onCardTap() {
    // 卡片整体点击事件
    console.log('卡片被点击');
  },

  /**
   * 操作按钮点击（查看详情、标为已读、删除）
   */
  onActionTap(event: WechatMiniprogram.CustomEvent) {
    const action = event.detail.action as string;

    // 简化处理：这里只是示例，实际应该根据具体通知 ID 处理
    if (action === 'viewDetail') {
      wx.showToast({
        title: '查看详情',
        icon: 'none',
      });
    } else if (action === 'markRead') {
      // 删除最后一条（示例）
      const updatedList = this.data.notificationList.map((item, index) => {
        if (index === this.data.notificationList.length - 1) {
          return { ...item, isRead: true };
        }
        return item;
      });

      this.setData({
        notificationList: updatedList,
        hasUnread: updatedList.some((item) => !item.isRead),
      });

      // 更新筛选标签的徽章数
      const updatedTabs = this.data.filterTabs.map((tab) => {
        if (tab.value === 'unread') {
          const unreadCount = updatedList.filter((item) => !item.isRead).length;
          return { ...tab, badge: unreadCount };
        }
        return tab;
      });

      this.setData({
        filterTabs: updatedTabs,
      });
    } else if (action === 'delete') {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条通知吗？',
        success: (res) => {
          if (res.confirm) {
            const updatedList = this.data.notificationList.slice(0, -1);
            this.setData({
              notificationList: updatedList,
              hasUnread: updatedList.some((item) => !item.isRead),
            });

            wx.showToast({
              title: '删除成功',
              icon: 'success',
            });
          }
        },
      });
    }
  },
});
