import * as dayjsImport from 'dayjs';
const dayjs = (dayjsImport as any).default || dayjsImport;
import { Seat, SeatsSelectData } from '../../types/seats-select.types';
import { t } from '../../utils/i18n';
import { toTimePeriods } from '../../utils/time-slot';

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
    // 当前日期，用于获取座位当天时段状态
    selectedDate: {
      type: String,
      value: '',
    },
    // 当前所选时间段
    currentTimePeriod: {
      type: String,
      value: 'morning',
    },
    // 时间段配置
    timePeriods: {
      type: Array,
      value: [],
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
    seatMatrix: [] as Array<Array<Seat | null>>,
    activeSeatId: '',
    activeSeat: null,
    seatTooltipStyle: '',
    seatTooltipArrowStyle: '',
    tooltipDirection: 'down',
    seatTooltipHeader: '',
    seatTooltipStatus: '',
    seatTooltipRows: [] as Array<{
      key: string;
      label: string;
      timeLabel: string;
      statusText: string;
      type: string;
    }>,

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
    selectedSeats(_newVal: string[]) {
      if (this.data.seats && this.data.seats.length > 0) {
        this.updateSeatsStatus();
      }
    },

    // 监听语言变化
    currentLang(newLang: string) {
      if (newLang) {
        this.initLanguage();
      }
    },

    selectedDate(_newDate: string) {},
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
          seatMatrix: [],
        });
        return;
      }

      const normalizeCoordinate = (value: any) => {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 1;
      };

      // 获取实际行列区间，去除完全空白的前置/后置行列
      const rows = seats.map((seat) => normalizeCoordinate(seat.row));
      const cols = seats.map((seat) => normalizeCoordinate(seat.col));
      const minRow = Math.min(...rows);
      const maxRow = Math.max(...rows);
      const minCol = Math.min(...cols);
      const maxCol = Math.max(...cols);
      const safeRows = Math.max(maxRow - minRow + 1, 1);
      const safeCols = Math.max(maxCol - minCol + 1, 1);

      // 固定座位大小，不再动态计算宽高
      const gap = 6;
      const seatSize = 80;

      const sortedSeats = [...seats].sort((a, b) => {
        const rowA = normalizeCoordinate(a.row);
        const rowB = normalizeCoordinate(b.row);
        if (rowA !== rowB) return rowA - rowB;
        return normalizeCoordinate(a.col) - normalizeCoordinate(b.col);
      });
      const seatMatrix: Array<Array<Seat | null>> = Array.from({ length: safeRows }, () =>
        Array.from({ length: safeCols }, () => null)
      );
      sortedSeats.forEach((seat) => {
        const rowIndex = normalizeCoordinate(seat.row) - minRow;
        const colIndex = normalizeCoordinate(seat.col) - minCol;
        if (rowIndex >= 0 && rowIndex < safeRows && colIndex >= 0 && colIndex < safeCols) {
          seatMatrix[rowIndex][colIndex] = seat;
        }
      });

      this.setData({
        rows: safeRows,
        cols: safeCols,
        seatSize,
        gridWidth: safeCols * seatSize + (safeCols - 1) * gap,
        seatMatrix,
      });
    },

    /**
     * 处理座位点击
     */
    handleSeatClick(e: any) {
      e.stopPropagation?.();
      if (this.data.disabled) {
        return;
      }

      // 点击任何座位时，先隐藏当前 tooltip，避免旧 tooltip 残留
      this.hideSeatTooltip();

      const seatId = e.currentTarget.dataset.id;
      const seat = this.data.seats.find((s) => s.id === seatId);

      if (!seat) {
        return;
      }

      const seatTooltipRows = this.buildTooltipRows(seat);
      const hasBookedRows =
        Array.isArray(seatTooltipRows) && seatTooltipRows.some((row) => row.type === 'booked');
      const tooltipHeaderKey = hasBookedRows
        ? 'reservation.info.bookedTimeRange'
        : 'reservation.info.timeRange';
      const tooltipStatus = this.buildTooltipStatus(seat);

      this.setData(
        {
          activeSeatId: seat.id,
          activeSeat: seat,
          seatTooltipHeader: t(tooltipHeaderKey),
          seatTooltipStatus: tooltipStatus,
          seatTooltipRows,
          seatTooltipStyle: 'visibility:hidden;',
        },
        () => {
          const query = this.createSelectorQuery();
          query.select('#seatMapContainer').boundingClientRect();
          query.select(`#seat-${seatId}`).boundingClientRect();
          query.select('.seat-tooltip').boundingClientRect();
          query.exec((res: any[]) => {
            const wrapperRect = res && res[0] ? res[0] : null;
            const rect = res && res[1] ? res[1] : null;
            const tooltipRect = res && res[2] ? res[2] : null;
            if (wrapperRect && rect && tooltipRect) {
              const positioning = this.computeTooltipPosition(
                rect,
                wrapperRect,
                seatTooltipRows.length,
                tooltipRect
              );
              this.setData({
                seatTooltipStyle: `${positioning.style} visibility: visible;`,
                seatTooltipArrowStyle: positioning.arrowStyle,
                tooltipDirection: positioning.direction,
              });
            }

            this.triggerEvent('seatTap', {
              seatId: seat.id,
              seat: seat,
              rect,
            });
          });
        }
      );

      // 不能选择已预约、维修中的座位
      if (seat.status === 'booked' || seat.status === 'maintenance') {
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

    hideSeatTooltip() {
      if (!this.data.activeSeat) return;
      this.setData({
        activeSeatId: '',
        activeSeat: null,
        seatTooltipStyle: '',
        seatTooltipArrowStyle: '',
        seatTooltipHeader: '',
        seatTooltipRows: [],
        seatTooltipStatus: '',
      });
    },

    handleGridScroll() {
      if (!this.data.activeSeatId) {
        return;
      }
      this.updateTooltipPosition();
    },

    updateTooltipPosition() {
      const seatId = this.data.activeSeatId;
      if (!seatId) {
        return;
      }
      const query = this.createSelectorQuery();
      query.select('#seatMapContainer').boundingClientRect();
      query.select(`#seat-${seatId}`).boundingClientRect();
      query.exec((res: any[]) => {
        const wrapperRect = res && res[0] ? res[0] : null;
        const rect = res && res[1] ? res[1] : null;
        if (wrapperRect && rect) {
          const positioning = this.computeTooltipPosition(
            rect,
            wrapperRect,
            this.data.seatTooltipRows.length
          );
          this.setData({
            seatTooltipStyle: positioning.style,
            seatTooltipArrowStyle: positioning.arrowStyle,
            tooltipDirection: positioning.direction,
          });
        }
      });
    },

    buildTooltipDescription(seat: Seat) {
      const features = [];
      if (seat.hasSocket) {
        features.push(t('common.seat.facilities.power'));
      }
      if (seat.isWindow) {
        features.push(t('common.seat.facilities.window'));
      }
      if (seat.zone) {
        features.push(seat.zone);
      }
      if (features.length > 0) {
        return features.join(' · ');
      }
      return t('reservation.seatMap.tooltip.basic');
    },

    buildTooltipStatus(seat: Seat) {
      if (seat.status === 'maintenance' || (seat.status === 'booked' && !seat.isMine)) {
        return t('common.status.booked');
      }
      if (seat.status === 'selected' || seat.isMine) {
        return t('common.status.selected');
      }
      return t('common.status.available');
    },

    buildTooltipRows(seatDetail: any) {
      const timePeriods =
        Array.isArray(this.data.timePeriods) && this.data.timePeriods.length > 0
          ? this.data.timePeriods
          : toTimePeriods([]);

      const bookings = Array.isArray(seatDetail.bookings) ? seatDetail.bookings : [];
      const rows: Array<any> = [];
      const currentTimePeriod = this.data.currentTimePeriod || '';
      const isMineSeat = seatDetail.isMine === true;

      const extractHHmm = (text: string) => {
        const match = String(text || '')
          .trim()
          .match(/^([01]\d|2[0-3]):([0-5]\d)/);
        return match ? `${match[1]}:${match[2]}` : '';
      };

      const normalizeTimeValue = (value: any) => {
        if (value === null || value === undefined) return '';
        const parsed = dayjs(value);
        if (parsed.isValid()) {
          return parsed.format('HH:mm');
        }
        const trimmed = String(value).trim();
        return extractHHmm(trimmed);
      };

      const formatInterval = (start: string, end: string) =>
        `${normalizeTimeValue(start)}-${normalizeTimeValue(end)}`;
      const statusLabel = (status: string) =>
        status === 'booked' || status === 'mine'
          ? t('common.status.booked')
          : status === 'maintenance'
            ? t('common.status.maintenance')
            : t('common.status.available');

      const compareTime = (a: string, b: string) => {
        const normalizedA = normalizeTimeValue(a);
        const normalizedB = normalizeTimeValue(b);
        return normalizedA < normalizedB ? -1 : normalizedA > normalizedB ? 1 : 0;
      };

      const bookingMatchesPeriod = (booking: any, period: any) => {
        const bookingSlot = String(booking.timeSlot ?? '').trim();
        const periodValue = String(period.value ?? '').trim();
        const periodSlot = String(period.timeSlot ?? '').trim();
        if (bookingSlot && (bookingSlot === periodValue || bookingSlot === periodSlot)) {
          return true;
        }
        if (booking.startTime && booking.endTime) {
          const start = String(booking.startTime);
          const end = String(booking.endTime);
          return !(compareTime(end, period.start) <= 0 || compareTime(start, period.end) >= 0);
        }
        return false;
      };

      if (bookings.length === 0 && !seatDetail.timeSlotStatus) {
        const statusMap: Record<string, string> = {
          '0': 'available',
          '1': 'booked',
          '2': 'maintenance',
          available: 'available',
          booked: 'booked',
          maintenance: 'maintenance',
        };
        const seatStatus = statusMap[String(seatDetail.status)] || 'available';
        timePeriods.forEach((period: any) => {
          const isCurrentBooked = seatStatus === 'booked' && period.value === currentTimePeriod;
          const type =
            seatStatus === 'maintenance'
              ? 'maintenance'
              : isCurrentBooked
                ? isMineSeat
                  ? 'mine'
                  : 'booked'
                : 'available';
          rows.push({
            key: period.value,
            label: period.label,
            timeLabel: formatInterval(period.start, period.end),
            statusText: statusLabel(type),
            type,
          });
        });
        return rows;
      }

      timePeriods.forEach((period: any) => {
        const periodBookings = bookings
          .filter((booking: any) => bookingMatchesPeriod(booking, period))
          .map((booking: any) => {
            let startTime = normalizeTimeValue(booking.startTime) || period.start;
            let endTime = normalizeTimeValue(booking.endTime) || period.end;
            if (compareTime(startTime, endTime) >= 0) {
              startTime = period.start;
              endTime = period.end;
            }
            return {
              startTime,
              endTime,
              status: 'booked',
            };
          })
          .sort((a: any, b: any) => compareTime(a.startTime, b.startTime));

        const uniquePeriodBookings = periodBookings.filter((booking: any, index: number) => {
          if (index === 0) return true;
          const prev = periodBookings[index - 1];
          return !(booking.startTime === prev.startTime && booking.endTime === prev.endTime);
        });

        if (uniquePeriodBookings.length > 0) {
          let currentStart = period.start;
          uniquePeriodBookings.forEach((booking: any, index: number) => {
            if (compareTime(currentStart, booking.startTime) < 0) {
              rows.push({
                key: `${period.value}-avail-${index}`,
                label: period.label,
                timeLabel: formatInterval(currentStart, booking.startTime),
                statusText: statusLabel('available'),
                type: 'available',
              });
            }
            rows.push({
              key: `${period.value}-booked-${index}`,
              label: period.label,
              timeLabel: formatInterval(booking.startTime, booking.endTime),
              statusText: statusLabel(booking.status),
              type:
                booking.status === 'available'
                  ? 'available'
                  : booking.status === 'maintenance'
                    ? 'maintenance'
                    : isMineSeat
                      ? 'mine'
                      : 'booked',
            });
            currentStart = booking.endTime;
          });
          if (compareTime(currentStart, period.end) < 0) {
            rows.push({
              key: `${period.value}-avail-end`,
              label: period.label,
              timeLabel: formatInterval(currentStart, period.end),
              statusText: statusLabel('available'),
              type: 'available',
            });
          }
        } else {
          const status = String(seatDetail.timeSlotStatus?.[period.value] ?? 'available');
          rows.push({
            key: period.value,
            label: period.label,
            timeLabel: formatInterval(period.start, period.end),
            statusText: statusLabel(status),
            type:
              status === 'available' || status === '0'
                ? 'available'
                : status === 'maintenance' || status === '2'
                  ? 'maintenance'
                  : isMineSeat
                    ? 'mine'
                    : 'booked',
          });
        }
      });

      return rows;
    },

    computeTooltipPosition(
      rect: any,
      wrapperRect: any,
      rowCount: number = 0,
      tooltipRect?: { width: number; height: number }
    ) {
      const cardWidth = tooltipRect?.width ?? Math.min(this.data.seatSize * 2 + 20, 220);
      const cardHeight = tooltipRect?.height ?? 140 + Math.max(rowCount, 1) * 58;
      const offsetX = rect.left - wrapperRect.left;
      const offsetY = rect.top - wrapperRect.top;
      const centerX = offsetX + rect.width / 2;
      const centerY = offsetY + rect.height / 2;
      const margin = 12;
      const maxLeft = Math.max(wrapperRect.width - cardWidth - margin, margin);
      const maxTop = Math.max(wrapperRect.height - cardHeight - margin, margin);

      const canPlaceRight = wrapperRect.width - (offsetX + rect.width) - margin > cardWidth;
      const canPlaceLeft = offsetX - margin > cardWidth;
      const shouldUseRight = offsetX < cardWidth + margin && canPlaceRight;
      const shouldUseLeft =
        wrapperRect.width - (offsetX + rect.width) < cardWidth + margin && canPlaceLeft;

      let tooltipLeft = 0;
      let tooltipTop = 0;
      let direction: 'left' | 'right' | 'up' | 'down' = 'down';

      if (shouldUseRight) {
        tooltipLeft = Math.min(offsetX + rect.width + margin, maxLeft);
        tooltipTop = Math.min(Math.max(centerY - cardHeight / 2, margin), maxTop);
        direction = 'left';
      } else if (shouldUseLeft) {
        tooltipLeft = Math.max(offsetX - cardWidth - margin, margin);
        tooltipTop = Math.min(Math.max(centerY - cardHeight / 2, margin), maxTop);
        direction = 'right';
      } else {
        const belowTop = offsetY + rect.height + margin;
        const aboveTop = offsetY - cardHeight - margin;
        const useAbove = belowTop + cardHeight > wrapperRect.height;
        tooltipTop = useAbove
          ? Math.max(margin, aboveTop)
          : Math.min(Math.max(belowTop, margin), maxTop);
        direction = useAbove ? 'up' : 'down';
        tooltipLeft = Math.min(Math.max(centerX - cardWidth / 2, margin), maxLeft);
      }

      const arrowPadding = 18;
      const arrowStyle =
        direction === 'left' || direction === 'right'
          ? `top: ${Math.min(Math.max(centerY - tooltipTop, arrowPadding), cardHeight - arrowPadding)}px;`
          : `left: ${Math.min(Math.max(centerX - tooltipLeft, arrowPadding), cardWidth - arrowPadding)}px;`;

      return {
        style: `left: ${tooltipLeft}px; top: ${tooltipTop}px; width: ${cardWidth}px;`,
        direction,
        arrowStyle,
      };
    },

    noop() {
      // 用于阻止 tooltip 内部点击冒泡，避免外部容器隐藏弹窗
    },

    /**
     * 判断座位是否可选择
     */
    isSeatSelectable(seat: Seat): boolean {
      return seat.status === 'available' || seat.status === 'selected';
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
