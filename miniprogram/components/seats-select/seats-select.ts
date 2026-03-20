import { type Seat, type SeatsSelectData } from './seats-select.types';
import { t } from '../../utils/i18n';

Component({
  options: {
    multipleSlots: true,
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 座位数据
    seats: {
      type: Array,
      value: [],
    },
    // 已选中的座位 ID 列表
    selectedSeats: {
      type: Array,
      value: [],
    },
    // 主题：light 或 dark
    theme: {
      type: String,
      value: 'light',
    },
    // 是否禁用选择
    disabled: {
      type: Boolean,
      value: false,
    },
    // 当前语言
    currentLang: {
      type: String,
      value: 'zh',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    seatSize: 60,
    rows: 0,
    cols: 0,
    gridWidth: 0,

    // 多语言文本
    seatMapTitle: '',
    seatMapSubtitle: '',
    seatMapWindow: '',
    seatMapLegendAvailable: '',
    seatMapLegendAvailableDesc: '',
    seatMapLegendBooked: '',
    seatMapLegendBookedDesc: '',
    seatMapLegendMaintenance: '',
    seatMapLegendMaintenanceDesc: '',
    seatMapLegendSelected: '',
    seatMapLegendSelectedDesc: '',
    seatMapLegendMine: '',
    seatMapLegendMineDesc: '',
    seatMapInstruction: '',
  } as SeatsSelectData,

  /**
   * 组件生命周期方法
   */
  lifetimes: {
    attached() {
      // 从全局 App 获取当前语言并初始化
      const app = getApp();
      const currentLang = app.globalData.currentLang || 'zh';

      // 确保组件的 currentLang 属性与全局状态同步
      this.setData({
        currentLang: currentLang,
      });

      // 初始化多语言文本
      this.initLanguage();

      // 延迟执行，确保 DOM 已渲染
      setTimeout(() => {
        this.calculateGridSize();
      }, 100);
    },
  },

  /**
   * 数据监听器
   */
  observers: {
    seats(newVal: Seat[]) {
      if (newVal && newVal.length > 0) {
        this.calculateGridSize();
      }
    },

    // 监听语言变化
    currentLang(newLang: string) {
      console.log('[seats-select] currentLang changed:', newLang);
      if (newLang) {
        console.log('[seats-select] Re-initializing language...');
        this.initLanguage();
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 计算网格尺寸
     */
    calculateGridSize() {
      const seats = this.data.seats;

      if (seats.length === 0) {
        // 如果没有座位数据，使用默认配置（单位：rpx）
        const gap = 8; // var(--common-spacing-sm) = 8rpx
        this.setData({
          rows: 5,
          cols: 8,
          seatSize: 80, // 80rpx
          gridWidth: 8 * 80 + 7 * gap, // 座位总宽 + 7 个 gap
        });
        return;
      }

      // 获取实际最大行列数
      const rows = Math.max(...seats.map((seat) => seat.row));
      const cols = Math.max(...seats.map((seat) => seat.col));

      // 计算最佳座位大小（考虑屏幕宽度）
      const systemInfo = wx.getSystemInfoSync();
      const gap = 8; // var(--common-spacing-sm) = 8rpx
      const availableWidth = systemInfo.windowWidth * 2 - 128; // windowWidth(px) 转 rpx，减去左右边距 128rpx

      // 计算每个座位的大小（不减去 gap，gap 是额外的）
      const seatSize = Math.min(Math.floor(availableWidth / cols), 120); // 最大 120rpx

      this.setData({
        rows,
        cols,
        seatSize,
        gridWidth: cols * seatSize + (cols - 1) * gap, // 座位总宽 + gap 总宽
      });
    },

    /**
     * 处理座位点击
     */
    handleSeatClick(e: any) {
      if (this.data.disabled) {
        console.log('座位选择已禁用');
        return;
      }

      const seatId = e.currentTarget.dataset.id;
      const seat = this.data.seats.find((s) => s.id === seatId);

      if (!seat) {
        console.error('未找到座位:', seatId);
        return;
      }

      console.log('点击座位:', seatId, '状态:', seat.status);

      // 不能选择已预约、维修中的座位
      if (seat.status === 'booked' || seat.status === 'maintenance') {
        // 触发表单错误事件
        this.triggerEvent('error', {
          seatId: seat.id,
          message: '该座位无法选择',
        });
        return;
      }

      // 触发选择事件
      this.triggerEvent('seatSelect', {
        seatId: seat.id,
        seat: seat,
      });
    },

    /**
     * 判断座位是否可选择
     */
    isSeatSelectable(seat: Seat): boolean {
      return seat.status === 'available' || seat.status === 'selected' || seat.status === 'mine';
    },

    /**
     * 初始化多语言文本
     */
    initLanguage() {
      this.setData({
        seatMapTitle: t('reservation.seatMap.title'),
        seatMapSubtitle: t('reservation.seatMap.subtitle'),
        seatMapWindow: t('reservation.seatMap.window'),
        seatMapLegendAvailable: t('reservation.seatMap.legend.available'),
        seatMapLegendAvailableDesc: t('reservation.seatMap.legend.available.desc'),
        seatMapLegendBooked: t('reservation.seatMap.legend.booked'),
        seatMapLegendBookedDesc: t('reservation.seatMap.legend.booked.desc'),
        seatMapLegendMaintenance: t('reservation.seatMap.legend.maintenance'),
        seatMapLegendMaintenanceDesc: t('reservation.seatMap.legend.maintenance.desc'),
        seatMapLegendSelected: t('reservation.seatMap.legend.selected'),
        seatMapLegendSelectedDesc: t('reservation.seatMap.legend.selected.desc'),
        seatMapLegendMine: t('reservation.seatMap.legend.mine'),
        seatMapLegendMineDesc: t('reservation.seatMap.legend.mine.desc'),
        seatMapInstruction: t('reservation.seatMap.instruction'),
      });
    },
  },
});
