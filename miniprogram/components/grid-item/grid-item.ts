import type { SafeComponentInstance } from '../../types/component-types';

Component({
  options: {
    multipleSlots: true,
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 模式：simple（简单）| card（卡片）| custom（自定义）
    mode: {
      type: String,
      value: 'simple',
    },
    // 图标名称
    icon: {
      type: String,
      value: '',
    },
    // 图标类型：vant | iconfont
    iconType: {
      type: String,
      value: 'iconfont', // 默认使用 iconfont
    },
    // 图标大小
    iconSize: {
      type: String,
      value: '48', // 增大图标
    },
    // 图标颜色
    iconColor: {
      type: String,
      value: '#409eff',
    },
    // 背景颜色
    bgColor: {
      type: String,
      value: '#fff',
    },
    // 标签
    label: {
      type: String,
      value: '',
    },
    // 名称（卡片模式）
    name: {
      type: String,
      value: '',
    },
    // 值/数值
    value: {
      type: String,
      value: '',
    },
    // 副标签
    sublabel: {
      type: String,
      value: '',
    },
    // 状态（卡片模式）
    status: {
      type: String,
      value: '',
    },
    // 状态文本（卡片模式）
    statusText: {
      type: String,
      value: '',
    },
    // 属性数组（卡片模式）
    attributes: {
      type: Array,
      value: [],
    },
    // 是否显示底部（卡片模式）
    showFooter: {
      type: Boolean,
      value: false,
    },
    // 操作按钮文本（卡片模式）
    actionText: {
      type: String,
      value: '',
    },
    // 是否显示图标按钮（卡片模式）
    showIconBtn: {
      type: Boolean,
      value: false,
    },
    // 自定义类名
    customClass: {
      type: String,
      value: '',
    },
    // 状态类名（用于样式控制）
    statusClass: {
      type: String,
      value: '',
    },
    // 是否可点击
    clickable: {
      type: Boolean,
      value: false,
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

    /**
     * 操作按钮点击
     */
    onAction(this: SafeComponentInstance) {
      this.triggerEvent('action', {}, {});
    },

    /**
     * 图标按钮点击
     */
    onIconAction(this: SafeComponentInstance) {
      this.triggerEvent('iconAction', {}, {});
    },
  },
});
