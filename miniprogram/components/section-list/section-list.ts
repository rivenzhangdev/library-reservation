import type { SafeComponentInstance } from '../../types/component-types';

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 模块标题
    title: {
      type: String,
      value: '',
    },
    // 列表项数据
    items: {
      type: Array,
      value: [],
    },
    // 容器类名
    containerClass: {
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
     * 处理列表项点击
     */
    onItemTap(this: SafeComponentInstance, event: WechatMiniprogram.TouchEvent) {
      const { index } = event.currentTarget.dataset;
      const item = this.data.items[index];

      // 触发点击事件，传递 item 和 index 给父组件
      this.triggerEvent('itemTap', {
        item,
        index,
      });
    },
  },
});
