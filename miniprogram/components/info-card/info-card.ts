Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 头像/主图标名称
    avatarIcon: {
      type: String,
      value: 'user-o',
    },
    // 头像大小（默认 80rpx）
    avatarSize: {
      type: String,
      value: '80',
    },
    // 卡片标题（如用户名）
    title: {
      type: String,
      value: '',
    },
    // 卡片副标题/等级（如会员等级）
    subtitle: {
      type: String,
      value: '',
    },
    // 详细信息数组
    details: {
      type: Array,
      value: [],
      // 示例：[
      //   { id: 'studentId', icon: 'idcard', iconSize: '28', iconColor: 'rgba(255,255,255,0.8)', text: '学号：20240001' }
      // ]
    },
    // 统计数据数组
    stats: {
      type: Array,
      value: [],
      // 示例：[
      //   { id: 'credit', icon: 'star', iconSize: '28', label: '信用分：100' }
      // ]
    },
    // 背景渐变色（可选，默认使用 CSS 变量）
    gradient: {
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
  methods: {},
});
