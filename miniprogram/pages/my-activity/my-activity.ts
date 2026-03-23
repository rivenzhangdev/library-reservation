import { getLangClassName, t } from '../../utils/i18n';

interface Activity {
  id: string;
  title: string;
  image: string;
  startDate: string;
  endDate: string;
  location: string;
  participants: number;
  maxParticipants: number;
  description: string;
  status: 'all' | 'registered' | 'ongoing' | 'upcoming' | 'ended';
  tags: Array<{
    text: string;
    position: 'left' | 'right';
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  }>;
  buttons?: Array<{
    text: string;
    action: string;
    type: string;
  }>;
}

Page({
  data: {
    // 状态筛选
    currentStatus: 'all',
    statusList: [] as Array<{ id: string; name: string }>,

    // 活动列表
    activities: [] as Activity[],
    filteredActivities: [] as Activity[],

    // 按钮配置
    activityButtons: {} as Record<string, Array<{ text: string; action: string; type: string }>>,

    // 搜索
    searchValue: '',

    // 多语言
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    searchPlaceholder: '',
    searchingHint: '',
    emptyHint: '',

    // 按钮文本
    detailText: '',
    checkInText: '',
    registerText: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log('=== 页面加载 ===');
    console.log('data:', this.data);

    // 初始化语言
    this.initLanguage();

    console.log('初始化语言后:', this.data);

    // 加载活动列表
    this.loadActivities();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const app = getApp();
    const currentLang = app.globalData?.currentLang || 'zh';

    if (currentLang !== this.data.currentLang) {
      this.initLanguage();
    }
  },

  /**
   * 初始化语言
   */
  initLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';

    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('activity.title') || '我的活动',
      searchPlaceholder: t('activity.search.placeholder') || '搜索活动',
      searchingHint: t('common.hint.loading') || '加载中',
      emptyHint: t('activity.empty') || '暂无活动',
      detailText: t('activity.btn.detail') || '查看详情',
      checkInText: t('activity.btn.checkIn') || '去打卡',
      registerText: t('activity.btn.register') || '立即报名',
      statusList: [
        { id: 'all', name: t('common.status.all') || '全部' },
        { id: 'registered', name: t('activity.status.registered') || '已报名' },
        { id: 'ongoing', name: t('common.status.ongoing') || '进行中' },
        { id: 'upcoming', name: t('common.status.upcoming') || '即将开始' },
        { id: 'ended', name: t('activity.status.ended') || '已结束' },
      ],
    });

    // 初始化按钮配置（必须在设置按钮文本之后）
    this.initActivityButtons();
  },

  /**
   * 初始化活动按钮配置
   */
  initActivityButtons() {
    const { detailText, checkInText, registerText } = this.data;

    const buttonsConfig: Record<string, Array<{ text: string; action: string; type: string }>> = {
      registered: [
        { text: detailText, action: 'onDetailTap', type: '' },
        { text: checkInText, action: 'onCheckInTap', type: 'primary' },
      ],
      ongoing: [
        { text: detailText, action: 'onDetailTap', type: '' },
        { text: checkInText, action: 'onCheckInTap', type: 'primary' },
      ],
      upcoming: [
        { text: detailText, action: 'onDetailTap', type: '' },
        { text: registerText, action: 'onRegisterTap', type: 'primary' },
      ],
      ended: [{ text: detailText, action: 'onDetailTap', type: 'full' }],
    };

    this.setData({
      activityButtons: buttonsConfig,
    });
  },

  /**
   * 加载活动列表
   */
  loadActivities() {
    wx.showLoading({
      title: this.data.searchingHint,
    });

    // TODO: 调用后端接口获取活动列表
    // 这里使用模拟数据
    setTimeout(() => {
      const { activityButtons } = this.data;

      const mockActivities: Activity[] = [
        {
          id: '1',
          title: '阅读马拉松挑战赛',
          image: 'https://picsum.photos/800/300?random=1',
          startDate: '2026-01-05',
          endDate: '2026-01-20',
          location: '图书馆各区域',
          participants: 328,
          maxParticipants: 500,
          description:
            '挑战连续阅读 7 天，赢取精美礼品！活动期间，每日在图书馆阅读满 2 小时并签到，即可获得积分奖励。',
          status: 'ongoing',
          tags: [
            { text: '已报名', position: 'left', type: 'primary' },
            { text: '进行中', position: 'right', type: 'success' },
          ],
        },
        {
          id: '2',
          title: '图书馆新生指南讲座',
          image: 'https://picsum.photos/800/300?random=2',
          startDate: '2026-01-25',
          endDate: '2026-01-25',
          location: '图书馆一楼报告厅',
          participants: 156,
          maxParticipants: 200,
          description: '为新生详细介绍图书馆的设施、服务和使用规则，帮助大家快速适应大学生活。',
          status: 'upcoming',
          tags: [{ text: '即将开始', position: 'right', type: 'warning' }],
        },
        {
          id: '3',
          title: '经典读书分享会',
          image: 'https://picsum.photos/800/300?random=3',
          startDate: '2026-01-10',
          endDate: '2026-01-10',
          location: '图书馆三楼研讨室',
          participants: 45,
          maxParticipants: 50,
          description: '分享你最喜欢的经典书籍，与其他书友交流阅读心得，共同成长。',
          status: 'registered',
          tags: [{ text: '已报名', position: 'left', type: 'primary' }],
        },
        {
          id: '4',
          title: '数字资源使用培训',
          image: 'https://picsum.photos/800/300?random=4',
          startDate: '2026-01-08',
          endDate: '2026-01-08',
          location: '图书馆电子阅览室',
          participants: 80,
          maxParticipants: 80,
          description: '学习如何使用图书馆的数字资源数据库，提升文献检索能力。',
          status: 'ended',
          tags: [{ text: '已结束', position: 'right', type: 'default' }],
        },
      ];

      // 为每个活动添加按钮配置
      const activitiesWithButtons = mockActivities.map((activity) => ({
        ...activity,
        buttons: activityButtons[activity.status] || [],
      }));

      console.log('=== 活动数据 ===');
      console.log('activityButtons:', activityButtons);
      console.log('activitiesWithButtons:', activitiesWithButtons);

      this.setData({
        activities: activitiesWithButtons,
        filteredActivities: activitiesWithButtons,
      });

      wx.hideLoading();
    }, 500);
  },

  /**
   * 搜索内容变化事件
   */
  onSearchChange(e: any) {
    this.setData({
      searchValue: e.detail,
    });

    // 防抖搜索
    this.debounceSearch();
  },

  /**
   * 防抖搜索
   */
  debounceSearch() {
    clearTimeout((this as any).searchTimer);
    (this as any).searchTimer = setTimeout(() => {
      this.filterActivities();
    }, 300);
  },

  /**
   * 状态筛选点击事件 (组件事件)
   */
  onStatusChange(e: any) {
    const statusId = e.detail.id;
    this.setData({
      currentStatus: statusId,
    });

    this.filterActivities();
  },

  /**
   * 状态筛选点击事件 (兼容旧版，已废弃)
   */
  onStatusTap(e: any) {
    const statusId = e.currentTarget.dataset.id;
    this.setData({
      currentStatus: statusId,
    });

    this.filterActivities();
  },

  /**
   * 筛选活动列表
   */
  filterActivities() {
    const { searchValue, currentStatus, activities } = this.data;

    let filtered = [...activities];

    // 按状态筛选
    if (currentStatus !== 'all') {
      filtered = filtered.filter((a) => a.status === currentStatus);
    }

    // 按关键字搜索
    if (searchValue) {
      filtered = filtered.filter(
        (a) =>
          a.title.includes(searchValue) ||
          a.location.includes(searchValue) ||
          a.description.includes(searchValue)
      );
    }

    this.setData({ filteredActivities: filtered });
  },

  /**
   * 处理查看详情
   */
  onDetailTap(e: any) {
    const { id } = e.currentTarget.dataset;

    // 跳转到活动详情页面
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${id}`,
      success: () => {
        wx.showToast({
          title: '打开活动详情',
          icon: 'none',
          duration: 1500,
        });
      },
      fail: () => {
        wx.showModal({
          title: '提示',
          content: '活动详情页面开发中',
          showCancel: false,
        });
      },
    });
  },

  /**
   * 处理去打卡
   */
  onCheckInTap(e: any) {
    const { id } = e.currentTarget.dataset;

    // 跳转到打卡页面
    wx.navigateTo({
      url: `/pages/activity-checkin/activity-checkin?id=${id}`,
      success: () => {
        wx.showToast({
          title: '去打卡',
          icon: 'none',
          duration: 1500,
        });
      },
      fail: () => {
        wx.showModal({
          title: '提示',
          content: '打卡功能开发中',
          showCancel: false,
        });
      },
    });
  },

  /**
   * 处理立即报名
   */
  onRegisterTap(e: any) {
    const { id } = e.currentTarget.dataset;

    // 跳转到报名页面
    wx.navigateTo({
      url: `/pages/activity-register/activity-register?id=${id}`,
      success: () => {
        wx.showToast({
          title: '立即报名',
          icon: 'none',
          duration: 1500,
        });
      },
      fail: () => {
        wx.showModal({
          title: '提示',
          content: '报名功能开发中',
          showCancel: false,
        });
      },
    });
  },
});
