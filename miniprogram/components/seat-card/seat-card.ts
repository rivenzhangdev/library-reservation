import { t } from '../../utils/i18n';

Component({
  /**
   * 组件的对外属性
   */
  options: {
    multipleSlots: true,
  },

  /**
   * 组件的对外属性
   */
  properties: {
    // 座位信息
    seatInfo: {
      type: Object,
      value: {
        id: '',
        name: '',
        zone: '',
        floor: '',
        description: '',
        status: 'available', // available, booked, maintenance
        facilities: [],
        distance: '',
        tags: [],
      },
    },
    // 是否显示收藏按钮
    showFavorite: {
      type: Boolean,
      value: false,
    },
    // 是否已收藏
    isFavorite: {
      type: Boolean,
      value: false,
    },
    // 按钮文本
    actionButtonText: {
      type: String,
      value: '立即预约',
    },
    // 按钮禁用状态
    buttonDisabled: {
      type: Boolean,
      value: false,
    },
    // 多语言
    currentLang: {
      type: String,
      value: 'zh',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    statusTypeMap: {
      available: 'success',
      booked: 'warning',
      maintenance: 'default',
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  lifetimes: {
    attached() {
      const that = this as any;
      that.updateLanguage();
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新语言
     */
    updateLanguage() {
      const currentLang = getApp<IAppOption>().globalData?.currentLang || 'zh';

      const that = this as any;
      that.setData({
        currentLang,
        statusTextMap: {
          available: t('common.status.available'),
          booked: t('common.status.booked'),
          maintenance: t('common.status.maintenance'),
        },
      });
    },

    /**
     * 处理预约按钮点击
     */
    onReserveTap() {
      const that = this as any;
      if (that.data.buttonDisabled) {
        return;
      }

      that.triggerEvent('reserve', {
        seatId: that.data.seatInfo.id,
        seatInfo: that.data.seatInfo,
      });
    },

    /**
     * 处理收藏按钮点击
     */
    onFavoriteTap() {
      const that = this as any;
      that.triggerEvent('favorite', {
        seatId: that.data.seatInfo.id,
        isFavorite: !that.data.isFavorite,
      });
    },

    /**
     * 处理卡片点击
     */
    onCardTap() {
      const that = this as any;
      that.triggerEvent('detail', {
        seatId: that.data.seatInfo.id,
        seatInfo: that.data.seatInfo,
      });
    },
  },
});
