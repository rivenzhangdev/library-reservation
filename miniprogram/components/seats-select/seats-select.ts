import { Seat, SeatsSelectData } from '../../types/seats-select.types';
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
    seatMapEmptyText: '',
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

      // 初始化时更新座位状态（处理初始选中状态）
      if (this.data.seats && this.data.seats.length > 0) {
        this.updateSeatsStatus();
      }
    },
  },

  /**
   * 数据监听器
   */
  observers: {
    seats(newVal: Seat[]) {
      if (Array.isArray(newVal)) {
        this.calculateGridSize();
      }
    },

    // 监听已选中的座位列表变化
    selectedSeats(newVal: string[]) {
      console.log('[seats-select] selectedSeats changed:', newVal);
      if (this.data.seats && this.data.seats.length > 0) {
        this.updateSeatsStatus();
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
        this.setData({
          rows: 0,
          cols: 0,
          seatSize: 80,
          gridWidth: 0,
        });
        return;
      }

      // 获取实际最大行列数
      const rows = Math.max(...seats.map((seat) => seat.row));
      const cols = Math.max(...seats.map((seat) => seat.col));

      // 计算最佳座位大小（考虑屏幕宽度，并避免座位过大导致布局过空）
      const gap = 8; // var(--common-spacing-sm) = 8rpx
      const availableWidth = 750 - 128; // 750rpx 设计稿宽度，减去左右边距 128rpx
      const computedSize = Math.floor((availableWidth - (cols - 1) * gap) / cols);
      const seatSize = Math.min(Math.max(computedSize, 80), 110); // 保持座位大小在 80~110rpx 范围内

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

      const query = this.createSelectorQuery();
      query.select(`#${seatId}`).boundingClientRect();
      query.selectViewport().scrollOffset();
      query.exec((res: any[]) => {
        const rect = res && res[0] ? res[0] : null;
        this.triggerEvent('seatTap', {
          seatId: seat.id,
          seat: seat,
          rect,
        });
      });

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
     * 更新座位状态（根据 selectedSeats 属性）
     */
    updateSeatsStatus() {
      const seats = this.data.seats;
      const selectedSeats = this.data.selectedSeats || [];

      // 创建新的座位数组，避免直接修改原数据
      const updatedSeats = seats.map((seat) => {
        // 如果座位在已选列表中，设置为 'selected' 状态
        if (selectedSeats.includes(seat.id)) {
          return { ...seat, status: 'selected' as const };
        } else {
          // 否则恢复为 'available' 状态（前提是原本就是 available）
          // 注意：不要改变 booked、maintenance、mine 等状态
          if (seat.status === 'selected') {
            return { ...seat, status: 'available' as const };
          }
          return seat;
        }
      });

      console.log('[seats-select] Updated seats status:', updatedSeats);
      this.setData({
        seats: updatedSeats,
      });
    },

    /**
     * 初始化多语言文本
     */
    initLanguage() {
      this.setData({
        seatMapTitle: t('reservation.seatMap.title'),
        seatMapSubtitle: t('reservation.seatMap.subtitle'),
        seatMapWindow: t('reservation.seatMap.window'),
        seatMapLegendAvailable: t('common.status.available'),
        seatMapLegendAvailableDesc: t('reservation.seatMap.legend.available.desc'),
        seatMapLegendBooked: t('common.status.booked'),
        seatMapLegendBookedDesc: t('reservation.seatMap.legend.booked.desc'),
        seatMapLegendMaintenance: t('common.status.maintenance'),
        seatMapLegendMaintenanceDesc: t('reservation.seatMap.legend.maintenance.desc'),
        seatMapLegendSelected: t('common.status.selected'),
        seatMapLegendSelectedDesc: t('reservation.seatMap.legend.selected.desc'),
        seatMapLegendMine: t('common.status.booked'),
        seatMapLegendMineDesc: t('reservation.seatMap.legend.mine.desc'),
        seatMapInstruction: t('reservation.seatMap.instruction'),
        seatMapEmptyText: t('common.empty.notFound'),
      });
    },
  },
});
