import type { SafeComponentInstance } from '../../types/component-types';

Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多 slot 支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    extClass: {
      type: String,
      value: '',
    },
    title: {
      type: String,
      value: '',
    },
    background: {
      type: String,
      value: '',
    },
    color: {
      type: String,
      value: '',
    },
    back: {
      type: Boolean,
      value: true,
    },
    loading: {
      type: Boolean,
      value: false,
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      // 显示隐藏的时候 opacity 动画效果
      type: Boolean,
      value: true,
    },
    show: {
      // 显示隐藏导航，隐藏的时候 navigation-bar 的高度占位还在
      type: Boolean,
      value: true,
      observer: '_showChange',
    },
    // back 为 true 的时候，返回的页面深度
    delta: {
      type: Number,
      value: 1,
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: '',
  },
  lifetimes: {
    attached(this: SafeComponentInstance) {
      const rect = wx.getMenuButtonBoundingClientRect();
      wx.getSystemInfo({
        success: (res) => {
          const isAndroid = res.platform === 'android';
          const isDevtools = res.platform === 'devtools';
          this.setData({
            ios: !isAndroid,
            innerPaddingRight: `padding-right: ${res.windowWidth - rect.left}px`,
            leftWidth: `width: ${res.windowWidth - rect.left}px`,
            safeAreaTop:
              isDevtools || isAndroid
                ? `height: calc(var(--height) + ${res.safeArea.top}px); padding-top: ${res.safeArea.top}px`
                : ``,
          });
        },
      });
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _showChange(this: SafeComponentInstance, show: boolean) {
      const animated = this.data.animated;
      let displayStyle = '';
      if (animated) {
        displayStyle = `opacity: ${show ? '1' : '0'};transition:opacity 0.5s;`;
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`;
      }
      this.setData({
        displayStyle,
      });
    },
    back(this: SafeComponentInstance) {
      const data = this.data;
      if (data.delta) {
        wx.navigateBack({
          delta: data.delta,
        });
      }
      this.triggerEvent('back', { delta: data.delta });
    },
  },
});
