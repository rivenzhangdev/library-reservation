/**
 * 状态筛选组件 - 类型定义
 */

/**
 * 状态项数据结构
 */
export interface StatusItem {
  /** 状态唯一标识 */
  id: string;
  /** 状态显示文本 */
  name: string;
  /** 可选：数量徽章 */
  count?: number;
}

/**
 * 组件 Properties 接口
 */
export interface StatusFilterProps {
  /** 状态列表 */
  statusList: StatusItem[];
  /** 当前选中的状态 ID */
  currentStatus: string;
  /** 是否可滚动，默认 true */
  scrollable?: boolean;
  /** 是否显示数量徽章，默认 false */
  showCount?: boolean;
}

/**
 * 组件 Data 接口
 */
export interface StatusFilterData {
  /** 内部使用的状态列表 */
  internalStatusList: StatusItem[];
  /** 内部使用的当前状态 */
  internalCurrentStatus: string;
  /** 是否可滚动 */
  isScrollable: boolean;
  /** 是否显示数量 */
  showCountBadge: boolean;
}
