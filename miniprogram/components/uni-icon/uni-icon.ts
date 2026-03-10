Component({
  options: {
    multipleSlots: true,
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 图标类型：'vant' | 'iconfont' | 'custom'
    type: {
      type: String,
      value: 'vant',
    },
    // 图标名称
    name: {
      type: String,
      value: '',
    },
    // 图标大小（默认单位 rpx，只需传数字）
    size: {
      type: Number,
      value: 32,
    },
    // 图标颜色
    color: {
      type: String,
      value: '',
    },
    // van-icon 的 class-prefix
    classPrefix: {
      type: String,
      value: 'van-icon',
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
  data: {
    iconStyle: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  lifetimes: {
    attached() {
      // 动态生成图标样式
      const that = this as any;
      const styleParts: string[] = [];

      // 只有 color 有值时才添加
      if (that.properties.color) {
        styleParts.push(`color: ${that.properties.color}`);
      }

      // 添加 font-size
      if (that.properties.size) {
        styleParts.push(`font-size: ${that.properties.size}rpx`);
      }

      // 拼接样式字符串
      const iconStyle = styleParts.length > 0 ? styleParts.join('; ') : '';

      that.setData({ iconStyle });
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 点击事件
     */
    onClick() {
      // 使用 any 类型绕过类型检查
      const that = this as any;
      that.triggerEvent('click', {});
    },
  },
});
