Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 座位标签（如：靠窗座位）
    seatLabel: {
      type: String,
      value: '',
    },
    // 座位名称（如：A1）
    seatName: {
      type: String,
      value: '',
    },
    // 座位类型（如：单人桌）
    seatType: {
      type: String,
      value: '',
    },
    // 距离（如：25m）
    distance: {
      type: String,
      value: '',
    },
    // 座位状态（available: 可用，occupied: 已占用，maintenance: 维修中）
    status: {
      type: String,
      value: 'available',
    },
    // 座位图标
    icon: {
      type: String,
      value: 'icon-home',
    },
    // 多语言文案
    statusText: {
      type: String,
      value: '可用',
    },
    reserveText: {
      type: String,
      value: '立即预约',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    // 立即预约按钮点击事件
    onReserve() {
      this.triggerEvent('reserve', {
        seatLabel: this.data.seatLabel,
        seatName: this.data.seatName,
        status: this.data.status,
      });
    },

    // 收藏按钮点击事件
    onFavorite() {
      this.triggerEvent('favorite', {
        seatLabel: this.data.seatLabel,
        seatName: this.data.seatName,
      });
    },

    // 点击进入座位详情
    onDetail() {
      this.triggerEvent('detail', {
        seatLabel: this.data.seatLabel,
        seatName: this.data.seatName,
      });
    },
  },
});
