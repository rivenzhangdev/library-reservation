/**
 * 核心 API 类型定义
 * 减少 any 使用，补齐接口类型
 */

// ========== 通用 ==========

/** API 统一响应结构 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

/** 分页参数 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  pageSize?: number;
}

/** 分页响应 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ========== 预约相关 ==========

/** 预约状态枚举 */
export const BookingStatusMap = {
  upcoming: 0,
  ongoing: 1,
  completed: 2,
  cancelled: 3,
  violated: 4,
} as const;

export type BookingStatusName = keyof typeof BookingStatusMap;
export type BookingStatusValue = (typeof BookingStatusMap)[BookingStatusName];

/** 预约记录 */
export interface BookingRecord {
  id: number;
  seatId: number;
  userId: string;
  date: string;
  timeSlot: number;
  startTime: string;
  endTime: string;
  status: BookingStatusValue;
  checkinTime?: string;
  checkoutTime?: string;
  seatName?: string;
  floorName?: string;
  zone?: string;
  rowNum?: number;
  colNum?: number;
  seatTypeName?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 创建预约请求 */
export interface CreateBookingParams {
  seatId: number;
  date: string;
  timeSlot: number;
  startTime: string;
  endTime: string;
}

/** 续约请求 */
export interface RenewBookingParams {
  timeSlot: number;
  location?: { latitude: number; longitude: number };
}

// ========== 变更申请 ==========

/** 变更申请类型 */
export type ChangeRequestType = 'cancel' | 'reschedule' | 'seat_change';

/** 变更申请状态 */
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';

/** 变更申请记录 */
export interface ChangeRequest {
  id: number;
  bookingId: number;
  userId: string;
  changeType: ChangeRequestType;
  reason: string;
  status: ChangeRequestStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  targetDate?: string;
  targetTimeSlot?: number;
  targetStartTime?: string;
  targetEndTime?: string;
  targetSeatId?: number;
  type?: ChangeRequestType;
  newDate?: string;
  newTimeSlot?: number;
  newStartTime?: string;
  newEndTime?: string;
  newSeatId?: number;
  booking?: BookingRecord;
  createdAt?: string;
  updatedAt?: string;
}

/** 提交变更申请请求 */
export interface CreateChangeRequestParams {
  bookingId: number;
  changeType: ChangeRequestType;
  reason: string;
  targetDate?: string;
  targetTimeSlot?: number;
  targetStartTime?: string;
  targetEndTime?: string;
  targetSeatId?: number;
  type?: ChangeRequestType;
  newDate?: string;
  newTimeSlot?: number;
  newStartTime?: string;
  newEndTime?: string;
  newSeatId?: number;
}

// ========== 活动相关 ==========

/** 活动状态 */
export type ActivityStatus = '0' | '1' | '2'; // 0=upcoming, 1=ongoing, 2=ended

/** 活动记录 */
export interface ActivityRecord {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  status: ActivityStatus;
  organizer?: string;
  imageUrl?: string;
  isJoined?: boolean;
  isCheckedIn?: boolean;
  isCheckedOut?: boolean;
  waitlistPosition?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ========== 预约规则 ==========

/** 预约规则 */
export interface BookingRule {
  ruleKey: string;
  category: string;
  value: string | number | boolean;
  label?: string;
  description?: string;
}

// ========== 座位/楼层 ==========

/** 楼层信息 */
export interface FloorInfo {
  id: number;
  name: string;
  description?: string;
}

/** 座位详情 (API 返回) */
export interface SeatDetail {
  id: number;
  seatCode?: string;
  row: number;
  col: number;
  floorId: number;
  floorName?: string;
  zone?: string;
  type: number;
  typeName?: string;
  hasSocket: boolean;
  isWindow: boolean;
  status: number;
  description?: string;
  tags?: string[];
}

// ========== 时间段配置 ==========

/** 时间段配置 */
export interface TimeSlotConfig {
  label: string;
  value: string;
  start: string;
  end: string;
  timeSlot: number;
  enabled: boolean;
}

/** 座位类型配置 */
export interface SeatTypeConfig {
  id?: number;
  type: number;
  value: string;
  label: string;
  icon?: string;
  enabled: boolean;
}

/** 座位设施配置 */
export interface SeatFacilityConfig {
  id?: number;
  key: string;
  label: string;
  icon?: string;
  enabled: boolean;
}
