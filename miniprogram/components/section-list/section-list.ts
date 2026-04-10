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
    // 是否启用点击反馈效果
    enableHover: {
      type: Boolean,
      value: true,
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
    onItemTap(this: SafeComponentInstance, event: WechatMiniprogram.CustomEvent) {
      const dataset = event.currentTarget.dataset;
      const disabled = dataset.disabled === true || dataset.disabled === 'true';
      if (disabled) {
        return;
      }

      // 从 dataset 获取 action
      const action = dataset.action;

      // 触发 itemTap 事件，只传递 action
      this.triggerEvent(
        'itemTap',
        {
          action,
        },
        {
          bubbles: true,
          composed: true,
        }
      );
    },
  },
});
