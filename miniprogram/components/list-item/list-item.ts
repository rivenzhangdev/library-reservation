import type { SafeComponentInstance } from '../../types/component-types';

Component({
  options: {
    multipleSlots: true,
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 图标名称（Vant 图标）
    iconName: {
      type: String,
      value: 'star-o',
    },
    // 图标大小（默认 40rpx）
    iconSize: {
      type: String,
      value: '40',
    },
    // 图标颜色（支持通用色或自定义颜色值）
    iconColor: {
      type: String,
      value: '#409eff',
    },
    // 图标背景色（支持通用色或自定义颜色值）
    iconBgColor: {
      type: String,
      value: '#e8f4ff',
    },
    // 列表项标签
    label: {
      type: String,
      value: '',
    },
    // 徽章数量（>0 时显示）
    badgeCount: {
      type: Number,
      value: 0,
    },
    // 箭头大小（默认 32rpx）
    arrowSize: {
      type: String,
      value: '32',
    },
    // 箭头颜色
    arrowColor: {
      type: String,
      value: '#999',
    },
    // 自定义类名
    customClass: {
      type: String,
      value: '',
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
    /**
     * 点击事件
     */
    onTap(this: SafeComponentInstance) {
      this.triggerEvent('tap', {}, {});
    },
  },
});
