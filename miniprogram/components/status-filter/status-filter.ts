import { SafeComponentInstance } from '../../types/component-types';
import { StatusFilterData, StatusFilterProps } from './status-filter.types';

Component<StatusFilterData, StatusFilterProps>({
  /**
   * 组件的属性列表
   */
  properties: {
    // 状态列表
    statusList: {
      type: Array,
      value: [],
    },
    // 当前选中的状态 ID
    currentStatus: {
      type: String,
      value: '',
    },
    // 是否可滚动，默认 true
    scrollable: {
      type: Boolean,
      value: true,
    },
    // 是否显示数量徽章，默认 false
    showCount: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    internalStatusList: [],
    internalCurrentStatus: '',
    isScrollable: true,
    showCountBadge: false,
  } as StatusFilterData,

  /**
   * 数据监听器
   */
  observers: {
    statusList(newVal: any[]) {
      this.setData({
        internalStatusList: newVal || [],
      });
    },
    currentStatus(newVal: string) {
      this.setData({
        internalCurrentStatus: newVal || '',
      });
    },
    scrollable(newVal: boolean) {
      this.setData({
        isScrollable: newVal !== false,
      });
    },
    showCount(newVal: boolean) {
      this.setData({
        showCountBadge: newVal || false,
      });
    },
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 处理状态点击事件
     */
    onStatusTap(this: SafeComponentInstance, event: any) {
      const statusId = event.currentTarget.dataset.id;

      // 触发状态变化事件
      this.triggerEvent('status-change', {
        id: statusId,
      });

      // 更新选中状态
      this.setData({
        internalCurrentStatus: statusId,
      });
    },
  },
});
