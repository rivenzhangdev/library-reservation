import { t, getLangClassName } from '../../utils/i18n';

Page({
  data: {
    // 搜索关键字
    searchValue: '',

    // 状态筛选
    currentStatus: 'all',
    statusList: [
      { id: 'all', name: '全部' },
      { id: 'available', name: '可用' },
      { id: 'booked', name: '已预约' },
      { id: 'maintenance', name: '维修中' },
    ],

    // 搜索结果
    searchResults: [] as any[],
    resultCount: 0,

    // 多语言
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    hintText: '',
    searchingHint: '',
    noResultsHint: '',
    actionButtonText: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
    const app = getApp();

    // 获取传递的搜索关键字
    const keyword = options.keyword || '';

    this.setData({
      searchValue: keyword,
      navTitle: app.t('searchResult.title'),
    });

    // 初始化语言
    this.initLanguage();

    // 执行搜索
    if (keyword) {
      this.performSearch(keyword);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const app = getApp();
    const globalLang = app.globalData?.currentLang || 'zh';

    if (globalLang !== this.data.currentLang) {
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
      navTitle: t('searchResult.title'),
      hintText: t('searchResult.hint.searchKeyword', { keyword: this.data.searchValue }),
      searchingHint: t('common.hint.loading'),
      noResultsHint: t('common.hint.noData'),
      actionButtonText: t('searchResult.action.reserve'),
      statusList: [
        { id: 'all', name: t('common.status.all') },
        { id: 'available', name: t('common.status.available') },
        { id: 'booked', name: t('common.status.booked') },
        { id: 'maintenance', name: t('common.status.maintenance') },
      ],
    });
  },

  /**
   * 执行搜索
   */
  performSearch(keyword: string) {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    wx.showLoading({
      title: this.data.searchingHint,
    });

    // TODO: 调用后端搜索接口
    // 这里使用模拟数据
    setTimeout(() => {
      const mockResults = [
        {
          id: 'C1-001',
          name: 'C 区 1 楼电子阅览区',
          zone: 'C 区',
          floor: '1 楼',
          description: '电子阅览区',
          status: 'available',
          facilities: [t('common.seat.facilities.power'), t('common.seat.facilities.network')],
          distance: 30,
          type: 'single',
        },
        {
          id: 'A2-015',
          name: 'A 区 2 楼研修室',
          zone: 'A 区',
          floor: '2 楼',
          description: '研修室',
          status: 'booked',
          facilities: [t('common.seat.facilities.window')],
          distance: 50,
          type: 'group',
        },
      ];

      // 根据关键字过滤结果
      const filtered = mockResults.filter((seat) => {
        return (
          seat.name.includes(keyword) || seat.id.includes(keyword) || seat.zone.includes(keyword)
        );
      });

      this.setData({
        searchResults: filtered,
        resultCount: filtered.length,
        hintText: t('searchResult.hint.searchKeyword', { keyword }),
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
  },

  /**
   * 搜索确认事件
   */
  onSearchConfirm(e: any) {
    const keyword = e.detail;
    if (keyword) {
      this.performSearch(keyword);
    }
  },

  /**
   * 搜索取消事件
   */
  onSearchCancel() {
    this.setData({
      searchValue: '',
      searchResults: [],
      resultCount: 0,
    });
  },

  /**
   * 状态筛选点击事件
   */
  onStatusTap(e: any) {
    const statusId = e.currentTarget.dataset.id;
    this.setData({
      currentStatus: statusId,
    });

    // 根据状态过滤结果
    this.filterByStatus(statusId);
  },

  /**
   * 根据状态过滤
   */
  filterByStatus(statusId: string) {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    // TODO: 调用后端接口或本地过滤
    setTimeout(() => {
      const mockResults = [
        {
          id: 'C1-001',
          name: 'C 区 1 楼电子阅览区',
          zone: 'C 区',
          floor: '1 楼',
          description: '电子阅览区',
          status: 'available',
          facilities: [t('common.seat.facilities.power'), t('common.seat.facilities.network')],
          distance: 30,
          type: 'single',
        },
        {
          id: 'A2-015',
          name: 'A 区 2 楼研修室',
          zone: 'A 区',
          floor: '2 楼',
          description: '研修室',
          status: statusId === 'booked' ? 'booked' : 'available',
          facilities: [t('common.seat.facilities.window')],
          distance: 50,
          type: 'group',
        },
      ];

      const filtered =
        statusId === 'all' ? mockResults : mockResults.filter((seat) => seat.status === statusId);

      this.setData({
        searchResults: filtered,
        resultCount: filtered.length,
      });
    }, 300);
  },

  /**
   * 处理预约按钮点击
   */
  onReserveTap(e: any) {
    const { seatId, seatInfo } = e.detail;
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    wx.showToast({
      title: t('searchResult.hint.reserveSuccess'),
      icon: 'success',
    });

    // TODO: 跳转到预约确认页面或调用预约接口
    console.log('预约座位:', seatId, seatInfo);
  },

  /**
   * 处理收藏按钮点击
   */
  onFavoriteTap(e: any) {
    const { seatId, isFavorite } = e.detail;
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    wx.showToast({
      title: isFavorite ? t('searchResult.hint.favoriteSuccess') : t('common.hint.success'),
      icon: 'success',
    });

    // TODO: 调用收藏接口
    console.log('收藏座位:', seatId, isFavorite);
  },

  /**
   * 处理详情按钮点击
   */
  onDetailTap(e: any) {
    const { seatId, seatInfo } = e.detail;

    // TODO: 跳转到座位详情页面
    console.log('查看座位详情:', seatId, seatInfo);
  },
});
