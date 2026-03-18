import type { SafeComponentInstance } from '../../types/component-types';

Component({
  options: {
    multipleSlots: true, // 支持多个插槽
    addGlobalClass: true,
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 展示模式：list(列表项) / card(内容卡片) / message(消息通知) / default(默认插槽)
    mode: {
      type: String,
      value: 'list',
    },
    // 图标名称
    icon: {
      type: String,
      value: '',
    },
    // 图标大小
    iconSize: {
      type: String,
      value: '32',
    },
    // 图标颜色
    iconColor: {
      type: String,
      value: '#409eff',
    },
    // 图标背景色
    iconBgColor: {
      type: String,
      value: '',
    },
    // 标题
    title: {
      type: String,
      value: '',
    },
    // 描述/副标题
    desc: {
      type: String,
      value: '',
    },
    // 状态类型（用于 van-tag）
    status: {
      type: String,
      value: '',
    },
    // 状态文案
    statusText: {
      type: String,
      value: '',
    },
    // 时间信息
    time: {
      type: String,
      value: '',
    },
    // 按钮文案
    btnText: {
      type: String,
      value: '',
    },
    // 按钮是否禁用
    disabled: {
      type: Boolean,
      value: false,
    },
    // 徽章数量（simple 模式）
    badgeCount: {
      type: Number,
      value: 0,
    },
    // 是否可点击
    clickable: {
      type: Boolean,
      value: true,
    },
    // 通知类型（notification 模式）
    type: {
      type: String,
      value: 'reservation',
    },
    // 是否显示查看详情（notification 模式）
    showViewDetail: {
      type: Boolean,
      value: false,
    },
    // 是否显示标为已读（notification 模式）
    showMarkRead: {
      type: Boolean,
      value: false,
    },
    // 是否显示删除（notification 模式）
    showDelete: {
      type: Boolean,
      value: false,
    },
    // 查看详情文案
    viewDetailText: {
      type: String,
      value: '查看详情',
    },
    // 标为已读文案
    markReadText: {
      type: String,
      value: '标为已读',
    },
    // 箭头大小
    arrowSize: {
      type: String,
      value: '32',
    },
    // 箭头颜色
    arrowColor: {
      type: String,
      value: '#999',
    },
    // 自定义样式类
    customClass: {
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
  data: {
    // 消息类型到图标的映射表（仅在 message 模式下使用）
    iconMap: {
      reservation: 'success', // ✓ 预约相关
      system: 'warning-o', // ⚠️ 系统通知
      activity: 'gift-o', // 🎁 活动
      message: 'chat-o', // 💬 普通消息
    } as Record<string, string>,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 卡片点击事件
     */
    onTap(this: SafeComponentInstance, event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('tap', event);
    },

    /**
     * 按钮点击事件
     */
    onBtnTap(this: SafeComponentInstance, event: WechatMiniprogram.TouchEvent) {
      if (!this.data.disabled) {
        this.triggerEvent('btnTap', event);
      }
    },

    /**
     * 操作按钮点击（查看详情、标为已读、删除）
     */
    onActionTap(this: SafeComponentInstance, event: WechatMiniprogram.TouchEvent) {
      const action = event.currentTarget.dataset.action as string;
      this.triggerEvent('actionTap', { action });
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
      // catch:tap 已经阻止了冒泡
    },
  },
});
