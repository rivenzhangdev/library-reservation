/**
 * 座位状态常量
 */
export const SEAT_STATUS = ['available', 'booked', 'maintenance', 'selected', 'mine'] as const;

/**
 * 座位类型常量
 */
export const SEAT_TYPE = ['single', 'double', 'group', 'open'] as const;

/**
 * 座位状态类型
 */
export type SeatStatus = (typeof SEAT_STATUS)[number];

/**
 * 座位类型类型
 */
export type SeatType = (typeof SEAT_TYPE)[number];

/**
 * 座位接口定义
 */
export type Seat = {
  /** 座位 ID */
  id: string;
  /** 排号 */
  row: number;
  /** 列号 */
  col: number;
  /** 座位状态 */
  status: SeatStatus;
  /** 座位类型 */
  type?: SeatType;
  /** 是否有插座 */
  hasSocket?: boolean;
  /** 是否靠窗 */
  isWindow?: boolean;
  /** 所属区域 */
  zone?: string;
  /** 已预约时间段 (仅 booked 和 mine 状态有效) */
  bookedTimeRange?: string;
};

/**
 * 座位选择组件属性
 */
export type SeatsSelectProperties = {
  /** 座位数据 */
  seats: Seat[];
  /** 已选中的座位 ID 列表 */
  selectedSeats: string[];
  /** 主题：light 或 dark */
  theme: 'light' | 'dark';
  /** 是否禁用选择 */
  disabled: boolean;
  /** 当前语言 */
  currentLang?: 'zh' | 'en';
};

/**
 * 座位选择组件数据
 */
export type SeatsSelectData = {
  /** 座位大小（像素） */
  seatSize: number;
  /** 总行数 */
  rows: number;
  /** 总列数 */
  cols: number;
  /** 网格宽度（像素） */
  gridWidth: number;

  /** 多语言文本 */
  seatMapTitle: string;
  seatMapSubtitle: string;
  seatMapWindow: string;
  seatMapLegendAvailable: string;
  seatMapLegendAvailableDesc: string;
  seatMapLegendBooked: string;
  seatMapLegendBookedDesc: string;
  seatMapLegendMaintenance: string;
  seatMapLegendMaintenanceDesc: string;
  seatMapLegendSelected: string;
  seatMapLegendSelectedDesc: string;
  seatMapLegendMine: string;
  seatMapLegendMineDesc: string;
  seatMapInstruction: string;
};

/**
 * 座位选择组件事件
 */
export type SeatSelectEvent = {
  /** 座位 ID */
  seatId: string;
  /** 座位详细信息 */
  seat: Seat;
};

/**
 * 座位错误事件
 */
export type SeatErrorEvent = {
  /** 座位 ID */
  seatId: string;
  /** 错误消息 */
  message: string;
};
