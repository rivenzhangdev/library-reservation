import { t, getLangClassName } from '../../utils/i18n';

Page({
  data: {
    // 收藏列表
    favoriteSeats: [] as any[],
    favoriteTimeSlots: [] as any[],

    // 总数
    totalCount: 0,
    favoriteSeatsCount: 0,

    // 多语言
    currentLang: 'zh' as 'zh' | 'en',
    languageClass: '',
    navTitle: '',
    emptySeatHint: '',
    emptyTimeSlotHint: '',

    // 常用座位标题
    favoriteSeatsTitle: '',

    // 常用时段标题
    favoriteTimeSlotsTitle: '',

    // 频率标签
    frequencyLabel: '',
    frequencyCount: '',

    // 选择按钮文案
    selectText: '',
    quickReserveText: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const app = getApp();

    this.setData({
      navTitle: app.t('myCollection.title'),
    });

    // 初始化语言
    this.initLanguage();

    // 加载收藏列表
    this.loadFavorites();
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

    // 刷新收藏列表
    this.loadFavorites();
  },

  /**
   * 初始化语言
   */
  initLanguage() {
    const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';

    this.setData({
      currentLang,
      languageClass: getLangClassName(),
      navTitle: t('myCollection.title'),
      emptySeatHint: t('myCollection.empty.seat'),
      emptyTimeSlotHint: t('myCollection.empty.timeSlot'),
      favoriteSeatsTitle: t('myCollection.favoriteSeats'),
      favoriteTimeSlotsTitle: t('myCollection.favoriteTimeSlots'),
      frequencyLabel: t('myCollection.frequency'),
      frequencyCount: t('myCollection.frequencyCount').replace('{count}', ''),
      selectText: t('myCollection.action.select'),
      quickReserveText: t('myCollection.action.quickReserve'),
    });
  },

  /**
   * 加载收藏列表
   */
  loadFavorites() {
    wx.showLoading({
      title: '加载中...',
    });

    // TODO: 调用后端接口获取收藏列表
    // 这里使用模拟数据
    setTimeout(() => {
      const mockFavoriteSeats = [
        {
          id: '1',
          seatName: t('myCollection.example.zone1Floor2Window'),
          seatId: 'A2-015',
          zone: 'A 区',
          floor: '2 楼',
          type: t('myCollection.example.readingAreaSingleDesk'),
          facilities: [t('common.seat.facilities.power'), t('common.seat.facilities.window')],
        },
        {
          id: '2',
          seatName: t('myCollection.example.zone3Floor3StudyRoom'),
          seatId: 'B3-008',
          zone: 'B 区',
          floor: '3 楼',
          type: t('myCollection.example.studyAreaDiscussionTable'),
          facilities: [t('common.seat.facilities.network')],
        },
      ];

      const mockFavoriteTimeSlots = [
        {
          id: '1',
          name: t('myCollection.example.weekdayAfternoon'),
          startTime: '14:00',
          endTime: '17:00',
          duration: t('myCollection.example.hours3'),
          usageCount: 12,
        },
        {
          id: '2',
          name: t('myCollection.example.saturdayMorning'),
          startTime: '09:00',
          endTime: '12:00',
          duration: t('myCollection.example.hours3'),
          usageCount: 8,
        },
        {
          id: '3',
          name: t('myCollection.example.sundayEvening'),
          startTime: '18:00',
          endTime: '21:00',
          duration: t('myCollection.example.hours3'),
          usageCount: 6,
        },
      ];

      this.setData({
        favoriteSeats: mockFavoriteSeats,
        favoriteTimeSlots: mockFavoriteTimeSlots,
        totalCount: mockFavoriteTimeSlots.length,
        favoriteSeatsCount: mockFavoriteSeats.length,
      });

      wx.hideLoading();
    }, 500);
  },

  /**
   * 处理座位卡片点击
   */
  onSeatCardTap(e: any) {
    const { id } = e.currentTarget.dataset;

    // TODO: 跳转到座位详情或预约页面
    console.log('查看座位:', id);

    // 可以跳转到预约页面，并选中该座位
    wx.navigateTo({
      url: '/pages/reservation/reservation',
    });
  },

  /**
   * 快速预约座位
   */
  onQuickReserveSeat(event: WechatMiniprogram.CustomEvent) {
    const { id, seatName, seatId, zone, floor, type, facilities, status } = event.currentTarget
      .dataset as any;

    // 跳转到预约页面，并传入座位信息
    const params = {
      seatId: id,
      seatName,
      seatCode: seatId,
      zone,
      floor,
      type,
      facilities: facilities ? facilities.join(',') : '',
      status,
    };

    // 预约页面是 tabBar 页面，使用 switchTab
    wx.switchTab({
      url: `/pages/reservation/reservation?${this.buildQuery(params)}`,
      success: () => {
        console.log('跳转到预约页面成功，参数:', params);
      },
      fail: (err) => {
        console.error('跳转失败:', err);
      },
    });
  },

  /**
   * 选择座位
   */
  onSelectSeat(event: WechatMiniprogram.CustomEvent) {
    const { id, seatName, seatId, zone, floor, type, facilities, status } = event.currentTarget
      .dataset as any;

    // TODO: 跳转到预约页面并选中该座位
    console.log('选择座位:', { id, seatName, seatId, zone, floor, type, facilities, status });
  },

  /**
   * 处理时段卡片点击
   */
  onTimeSlotCardTap(e: any) {
    const { id } = e.currentTarget.dataset;

    // TODO: 使用该时段进行预约
    console.log('使用时段预约:', id);

    // 可以跳转到预约页面，并选中该时段
    wx.switchTab({
      url: '/pages/reservation/reservation',
    });
  },

  /**
   * 取消收藏座位
   */
  onUnfavoriteSeat(event: WechatMiniprogram.CustomEvent) {
    const { id, name } = event.currentTarget.dataset as any;

    wx.showModal({
      title: t('myCollection.confirm.deleteSeatTitle'),
      content: t('myCollection.confirm.deleteSeatContent'),
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用后端接口删除收藏
          console.log('取消收藏座位:', { id, name });

          // 从列表中移除
          const updatedSeats = this.data.favoriteSeats.filter((seat) => seat.id !== id);
          this.setData({
            favoriteSeats: updatedSeats,
            favoriteSeatsCount: updatedSeats.length,
          });

          wx.showToast({
            title: t('myCollection.hint.deleteSuccess'),
            icon: 'success',
          });
        }
      },
    });
  },

  /**
   * 取消收藏时段
   */
  onUnfavoriteTimeSlot(event: WechatMiniprogram.CustomEvent) {
    const { id, name } = event.currentTarget.dataset as any;

    wx.showModal({
      title: t('myCollection.confirm.deleteTimeSlotTitle'),
      content: t('myCollection.confirm.deleteTimeSlotContent'),
      confirmText: t('common.btn.confirm'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用后端接口删除收藏
          console.log('取消收藏时段:', { id, name });

          // 从列表中移除
          const updatedTimeSlots = this.data.favoriteTimeSlots.filter((slot) => slot.id !== id);
          this.setData({
            favoriteTimeSlots: updatedTimeSlots,
            totalCount: updatedTimeSlots.length,
          });

          wx.showToast({
            title: t('myCollection.hint.deleteSuccess'),
            icon: 'success',
          });
        }
      },
    });
  },

  /**
   * 删除时段收藏
   */
  onDeleteTimeSlot(event: WechatMiniprogram.CustomEvent) {
    const { id } = event.currentTarget.dataset as any;

    wx.showModal({
      title: t('myCollection.confirm.deleteTimeSlotTitle'),
      content: t('myCollection.confirm.deleteTimeSlotContent'),
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用后端接口删除收藏
          wx.showToast({
            title: t('myCollection.hint.deleteSuccess'),
            icon: 'success',
          });

          // 从列表中移除
          const newTimeSlots = this.data.favoriteTimeSlots.filter((item) => item.id !== id);
          this.setData({
            favoriteTimeSlots: newTimeSlots,
            totalCount: newTimeSlots.length,
          });
        }
      },
    });
  },

  /**
   * 选择时段
   */
  onSelectTimeSlot(event: WechatMiniprogram.CustomEvent) {
    const { id, name, startTime, endTime, usageCount } = event.currentTarget.dataset as any;

    if (!startTime || !endTime) {
      wx.showModal({
        title: '参数错误',
        content: '无法获取时段信息，请重试',
        showCancel: false,
      });
      return;
    }

    // 跳转到预约页面，并传入时段信息
    const params = {
      timeSlotId: id,
      timeSlotName: name,
      startTime,
      endTime,
      usageCount,
    };

    // 预约页面是 tabBar 页面，使用 switchTab
    wx.switchTab({
      url: `/pages/reservation/reservation?${this.buildQuery(params)}`,
      success: () => {
        console.log('跳转到预约页面成功，参数:', params);
      },
      fail: (err) => {
        console.error('跳转失败:', err);
      },
    });
  },

  /**
   * 删除座位收藏（保留兼容）
   */
  onDeleteSeat(event: WechatMiniprogram.CustomEvent) {
    this.onUnfavoriteSeat(event);
  },

  /**
   * 删除时段收藏（保留兼容）
   */
  onDeleteTimeSlotOld(event: WechatMiniprogram.CustomEvent) {
    this.onUnfavoriteTimeSlot(event);
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 微信小程序中不需要手动调用 stopPropagation
    // 使用 catch:tap 即可阻止冒泡
  },

  /**
   * 构建查询参数
   */
  buildQuery(params: Record<string, string>) {
    return Object.entries(params)
      .filter(([key, value]) => {
        const hasValue = value !== undefined && value !== null;
        if (!hasValue) {
          console.log('跳过空参数:', key);
        }
        return hasValue;
      })
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  },
});
