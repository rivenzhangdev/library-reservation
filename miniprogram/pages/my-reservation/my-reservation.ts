import { getLangClassName, t } from '../../utils/i18n';

Page({
  data: {
    // 搜索
    searchValue: '',

    // 状态筛选
    currentStatus: 'all',
    statusList: [] as Array<{ id: string; name: string; count: number }>,

    // 预约记录列表
    reservations: [] as any[],
    filteredReservations: [] as any[],

    // 多语言
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    searchPlaceholder: '',
    searchingHint: '',
    emptyHint: '',

    // 确认对话框文本
    confirmCheckinTitle: '',
    confirmCheckinContent: '',
    confirmRenewTitle: '',
    confirmRenewContent: '',
    confirmCancelTitle: '',
    confirmCancelContent: '',

    // 成功提示
    checkinSuccessHint: '',
    renewSuccessHint: '',
    cancelSuccessHint: '',

    // 操作按钮文本
    actionCheckinText: '',
    actionRenewText: '',
    actionCancelText: '',
    actionDetailText: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const app = getApp();

    this.setData({
      navTitle: app.t('myReservation.title'),
    });

    // 初始化语言
    this.initLanguage();

    // 加载预约记录
    this.loadReservations();
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

    // 刷新预约记录
    this.loadReservations();
  },

  /**
   * 初始化语言
   */
  initLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';

    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('myReservation.title'),
      searchPlaceholder: t('myReservation.search.placeholder'),
      searchingHint: t('common.hint.loading'),
      emptyHint: t('myReservation.empty'),
      confirmCheckinTitle: t('myReservation.confirm.checkinTitle'),
      confirmCheckinContent: t('myReservation.confirm.checkinContent'),
      confirmRenewTitle: t('myReservation.confirm.renewTitle'),
      confirmRenewContent: t('myReservation.confirm.renewContent'),
      confirmCancelTitle: t('myReservation.confirm.cancelTitle'),
      confirmCancelContent: t('myReservation.confirm.cancelContent'),
      checkinSuccessHint: t('myReservation.hint.checkinSuccess'),
      renewSuccessHint: t('myReservation.hint.renewSuccess'),
      cancelSuccessHint: t('myReservation.hint.cancelSuccess'),
      actionCheckinText: t('myReservation.action.checkin'),
      actionRenewText: t('myReservation.action.renew'),
      actionCancelText: t('common.btn.cancel'),
      actionDetailText: t('common.btn.detail'),
      statusList: [
        { id: 'all', name: t('common.status.all'), count: 0 },
        { id: 'ongoing', name: t('common.status.ongoing'), count: 0 },
        { id: 'upcoming', name: t('common.status.upcoming'), count: 0 },
        { id: 'completed', name: t('common.status.completed'), count: 0 },
        { id: 'cancelled', name: t('common.status.cancelled'), count: 0 },
        { id: 'violated', name: t('common.status.violated'), count: 0 },
      ],
    });
  },

  /**
   * 加载预约记录
   */
  loadReservations() {
    wx.showLoading({
      title: this.data.searchingHint,
    });

    // TODO: 调用后端接口获取预约记录
    // 这里使用模拟数据
    setTimeout(() => {
      const mockReservations = [
        {
          id: '1',
          seatName: t('myReservation.example.zone1Floor2Window'),
          seatId: 'A2-015',
          zone: 'A 区',
          floor: '2 楼',
          date: '2026-01-15',
          startTime: '08:00',
          endTime: '12:00',
          status: 'ongoing',
          type: t('myReservation.example.readingAreaSingleDesk'),
        },
        {
          id: '2',
          seatName: t('myReservation.example.zone3Floor3StudyRoom'),
          seatId: 'B3-008',
          zone: 'B 区',
          floor: '3 楼',
          date: '2026-01-16',
          startTime: '14:00',
          endTime: '18:00',
          status: 'upcoming',
          type: t('myReservation.example.studyAreaDiscussionTable'),
        },
        {
          id: '3',
          seatName: t('myReservation.example.zone1Floor5SingleDesk'),
          seatId: 'A5-023',
          zone: 'A 区',
          floor: '5 楼',
          date: '2026-01-10',
          startTime: '09:00',
          endTime: '17:00',
          status: 'completed',
          type: t('myReservation.example.readingAreaSingleDesk'),
        },
      ];

      this.setData({
        reservations: mockReservations,
        filteredReservations: mockReservations,
      });

      // 更新各状态数量
      this.updateStatusCounts(mockReservations);

      wx.hideLoading();
    }, 500);
  },

  /**
   * 更新状态数量
   */
  updateStatusCounts(reservations: any[]) {
    const counts = {
      all: reservations.length,
      ongoing: reservations.filter((r) => r.status === 'ongoing').length,
      upcoming: reservations.filter((r) => r.status === 'upcoming').length,
      completed: reservations.filter((r) => r.status === 'completed').length,
      cancelled: reservations.filter((r) => r.status === 'cancelled').length,
      violated: reservations.filter((r) => r.status === 'violated').length,
    };

    const statusList = this.data.statusList.map((item) => ({
      ...item,
      count: counts[item.id as keyof typeof counts],
    }));

    // 为每个预约记录计算 tag 类型和状态名称
    const processedReservations = reservations.map((r) => ({
      ...r,
      tagType: this.getTagTypeByStatus(r.status),
      statusName: this.getStatusNameByStatus(r.status),
    }));

    this.setData({
      statusList,
      reservations: processedReservations,
      filteredReservations: processedReservations,
    });
  },

  /**
   * 根据状态获取标签类型
   */
  getTagTypeByStatus(status: string): string {
    switch (status) {
      case 'ongoing':
        return 'success';
      case 'upcoming':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'default';
      case 'violated':
        return 'danger';
      default:
        return 'default';
    }
  },

  /**
   * 根据状态获取状态名称
   */
  getStatusNameByStatus(status: string): string {
    const statusItem = this.data.statusList.find((s) => s.id === status);
    return statusItem ? statusItem.name : '';
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
      this.filterReservations();
    }, 300);
  },

  /**
   * 状态筛选点击事件
   */
  onStatusTap(e: any) {
    const statusId = e.currentTarget.dataset.id;
    this.setData({
      currentStatus: statusId,
    });

    this.filterReservations();
  },

  /**
   * 筛选预约记录
   */
  filterReservations() {
    const { searchValue, currentStatus, reservations } = this.data;

    let filtered = [...reservations];

    // 按状态筛选
    if (currentStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === currentStatus);
    }

    // 按关键字搜索
    if (searchValue) {
      filtered = filtered.filter(
        (r) =>
          r.seatName.includes(searchValue) ||
          r.seatId.includes(searchValue) ||
          r.zone.includes(searchValue) ||
          r.floor.includes(searchValue)
      );
    }

    this.setData({ filteredReservations: filtered });
  },

  /**
   * 处理签到按钮点击
   */
  onCheckinTap(e: any) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: this.data.confirmCheckinTitle,
      content: this.data.confirmCheckinContent,
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用签到接口
          console.log('签到:', id);

          wx.showToast({
            title: this.data.checkinSuccessHint,
            icon: 'success',
          });

          // 刷新列表
          this.loadReservations();
        }
      },
    });
  },

  /**
   * 处理续约按钮点击
   */
  onRenewTap(e: any) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: this.data.confirmRenewTitle,
      content: this.data.confirmRenewContent,
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用续约接口
          console.log('续约:', id);

          wx.showToast({
            title: this.data.renewSuccessHint,
            icon: 'success',
          });

          // 刷新列表
          this.loadReservations();
        }
      },
    });
  },

  /**
   * 处理取消按钮点击
   */
  onCancelTap(e: any) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: this.data.confirmCancelTitle,
      content: this.data.confirmCancelContent,
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用取消接口
          console.log('取消:', id);

          wx.showToast({
            title: this.data.cancelSuccessHint,
            icon: 'success',
          });

          // 刷新列表
          this.loadReservations();
        }
      },
    });
  },

  /**
   * 处理查看详情
   */
  onDetailTap(e: any) {
    const { id } = e.currentTarget.dataset;

    // TODO: 跳转到预约详情页面
    console.log('查看详情:', id);
  },
});
