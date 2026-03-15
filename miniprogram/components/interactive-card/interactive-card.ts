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
    // 图标颜色
    iconColor: {
      type: String,
      value: '#409eff',
    },
    // 卡片标题
    title: {
      type: String,
      value: '',
    },
    // 卡片描述
    desc: {
      type: String,
      value: '',
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
