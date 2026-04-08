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
    // 额外添加用于按钮传递的数据属性
    btnDataId: {
      type: String,
      value: '',
    },
    btnDataName: {
      type: String,
      value: '',
    },
    btnDataStartTime: {
      type: String,
      value: '',
    },
    btnDataEndTime: {
      type: String,
      value: '',
    },
    btnDataUsageCount: {
      type: Number,
      value: 0,
    },
    // 座位相关的数据属性
    btnDataSeatName: {
      type: String,
      value: '',
    },
    btnDataSeatId: {
      type: String,
      value: '',
    },
    btnDataZone: {
      type: String,
      value: '',
    },
    btnDataFloor: {
      type: String,
      value: '',
    },
    btnDataType: {
      type: String,
      value: '',
    },
    btnDataFacilities: {
      type: Array,
      value: [],
    },
    btnDataStatus: {
      type: String,
      value: '',
    },
    // 收藏模式相关属性
    favoriteIcon: {
      type: String,
      value: '',
    },
    isFavorite: {
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
      console.log('卡片被点击，事件类型:', event.type);
      // 触发 tap 事件，并传递 item 数据，启用事件冒泡
      this.triggerEvent(
        'tap',
        {
          item: {
            iconName: this.data.icon,
            iconColor: this.data.iconColor,
            iconBgColor: this.data.iconBgColor,
            label: this.data.title,
            badgeCount: this.data.badgeCount,
            clickable: this.data.clickable,
          },
        },
        {
          bubbles: true,
          composed: true,
        }
      );
    },

    /**
     * 按钮点击事件
     */
    onBtnTap(this: SafeComponentInstance, event: WechatMiniprogram.TouchEvent) {
      console.log('===== content-card onBtnTap 被调用 =====');
      console.log('this.data:', this.data);

      if (!this.data.disabled) {
        // 阻止事件冒泡到父容器
        (event as any).stopPropagation?.();

        // 从组件的 data 中获取数据（通过 properties 传递）
        // 支持时段和座位两种数据
        const dataset: any = {
          id: this.data.btnDataId,
          name: this.data.btnDataName,
          startTime: this.data.btnDataStartTime,
          endTime: this.data.btnDataEndTime,
          usageCount: this.data.btnDataUsageCount,
          // 座位相关数据
          seatName: this.data.btnDataSeatName,
          seatId: this.data.btnDataSeatId,
          zone: this.data.btnDataZone,
          floor: this.data.btnDataFloor,
          type: this.data.btnDataType,
          facilities: this.data.btnDataFacilities,
          status: this.data.btnDataStatus,
        };

        console.log('从 this.data 获取的 dataset:', dataset);
        console.log('准备触发 btn-tap 事件');

        // 触发 btn-tap 事件，并传递 dataset 数据
        this.triggerEvent('btnTap', {
          dataset: dataset,
        });

        console.log('btn-tap 事件已触发');
      } else {
        console.log('按钮被禁用，不触发事件');
      }
    },

    /**
     * 收藏按钮点击事件
     */
    onFavoriteTap(this: SafeComponentInstance, event: WechatMiniprogram.TouchEvent) {
      console.log('===== content-card onFavoriteTap 被调用 =====');

      // 阻止事件冒泡到父容器
      (event as any).stopPropagation?.();

      // 触发 favorite-tap 事件
      this.triggerEvent('favoriteTap', {
        isFavorite: this.data.isFavorite,
      });

      console.log('favorite-tap 事件已触发');
    },

    /**
     * 操作按钮点击（查看详情、标为已读、删除）
     */
    onActionTap(this: SafeComponentInstance, event: WechatMiniprogram.TouchEvent) {
      const action = event.currentTarget.dataset.action as string;
      this.triggerEvent('actionTap', {
        action,
        id: this.data.btnDataId,
      });
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
      // catch:tap 已经阻止了冒泡
    },
  },
});
