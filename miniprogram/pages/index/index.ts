// @ts-ignore
import * as echarts from '../../components/ec-canvas/echarts.min';
import { t } from '../../utils/i18n';

Page({
  data: {
    value: '',
    currentLang: 'zh', // 当前语言，用于样式选择器
    ec: {
      lazyLoad: true, // 启用懒加载模式，手动初始化图表
    } as any,

    // 多语言文案绑定到 data，供 WXML 使用
    navTitle: t('nav.title'),
    searchPlaceholder: t('search.placeholder'),
    openingHoursTitle: t('openingHours.title'),
    openingHoursTime: t('openingHours.time'),
    openingHoursStatus: t('openingHours.status'),
    seatStatusTitle: t('seatStatus.title'),
    realTimeTitle: t('realTime.title'),
    recommendTitle: t('recommend.title'),
    viewAllText: t('common.btn.viewAll'),
    activityTitle: t('activity.title'),
    viewMoreActivity: t('common.btn.viewMore'),

    // 搜索标签
    searchTags: [
      t('search.tags.power'),
      t('search.tags.window'),
      t('search.tags.single'),
      t('search.tags.double'),
      t('search.tags.group'),
    ],

    // 功能卡片
    actionCards: [
      { icon: 'shopping-cart-o', text: t('common.btn.confirm') },
      { icon: 'home', text: t('actions.myReservation') },
      { icon: 'replay', text: t('actions.renew') },
      { icon: 'home', text: t('actions.checkin') },
    ],

    // 座位状态
    seatStatus: {
      total: { label: t('seatStatus.total'), value: '500' },
      available: { label: t('seatStatus.available'), value: '320', percent: '64%' },
      reserved: { label: t('seatStatus.reserved'), value: '150', percent: '30%' },
      maintenance: { label: t('seatStatus.maintenance'), value: '30', percent: '6%' },
    },

    // 实时信息
    realTimeItems: [
      {
        icon: 'home',
        label: t('realTime.users'),
        value: '280',
        sublabel: t('realTime.users.sublabel'),
        bgColor: '#e8f4ff',
        iconColor: '#409eff',
      },
      {
        icon: 'home',
        label: t('realTime.comfort'),
        value: '24℃',
        sublabel: t('realTime.comfort.sublabel'),
        bgColor: '#fff7e8',
        iconColor: '#e6a23c',
      },
      {
        icon: 'home',
        label: t('realTime.quiet'),
        value: '45dB',
        sublabel: t('realTime.quiet.sublabel'),
        bgColor: '#e8f9f0',
        iconColor: '#2ecc71',
      },
      {
        icon: 'home',
        label: t('realTime.popular'),
        value: 'A 区 2 楼',
        sublabel: t('realTime.popular.sublabel'),
        bgColor: '#ffe8e8',
        iconColor: '#e74c3c',
      },
      {
        icon: 'home',
        label: t('realTime.booked'),
        value: '156',
        sublabel: t('realTime.booked.sublabel'),
        bgColor: '#f3e8ff',
        iconColor: '#9b59b6',
      },
      {
        icon: 'home',
        label: t('realTime.total'),
        value: '325',
        sublabel: t('realTime.total.sublabel'),
        bgColor: '#e8f0ff',
        iconColor: '#3498db',
      },
    ],

    // 推荐座位
    seatList: [
      {
        seatLabel: t('seat.window'),
        seatName: 'A1',
        seatType: t('seat.type.single'),
        distance: '25m',
        status: 'available',
        icon: 'bag-o',
        statusText: t('common.status.available'),
        reserveText: t('common.btn.confirm'),
      },
      {
        seatLabel: t('seat.quiet'),
        seatName: 'B12',
        seatType: t('seat.type.single'),
        distance: '15m',
        status: 'available',
        icon: 'bag-o',
        statusText: t('common.status.available'),
        reserveText: t('common.btn.confirm'),
      },
      {
        seatLabel: t('seat.power'),
        seatName: 'C08',
        seatType: t('seat.type.double'),
        distance: '30m',
        status: 'available',
        icon: 'bag-o',
        statusText: t('common.status.available'),
        reserveText: t('common.btn.confirm'),
      },
    ],

    // 活动列表
    activityList: [
      {
        title: t('activity.marathon'),
        desc: t('activity.marathon.desc'),
        status: 'warning',
        statusText: t('common.status.ongoing'),
        btnText: t('common.btn.confirm'),
        time: '2026.01.05 - 2026.01.20',
        disabled: false,
      },
      {
        title: t('activity.sharing'),
        desc: t('activity.sharing.desc'),
        status: 'primary',
        statusText: t('common.status.pending'),
        btnText: t('common.btn.confirm'),
        time: '2026.01.15 - 2026.01.25',
        disabled: false,
      },
      {
        title: t('activity.retrieval'),
        desc: t('activity.retrieval.desc'),
        status: 'success',
        statusText: t('common.status.pending'),
        btnText: t('common.btn.confirm'),
        time: '2026.01.20 - 2026.01.22',
        disabled: false,
      },
      {
        title: t('activity.classic'),
        desc: t('activity.classic.desc'),
        status: 'default',
        statusText: t('common.status.completed'),
        btnText: t('common.btn.cancel'),
        time: '2025.12.20 - 2025.12.31',
        disabled: true,
      },
    ],
  },

  onLoad() {
    // 监听语言切换事件
    const app = getApp<IAppOption>();
    if (app) {
      this.updateLanguage();
    }
  },

  onShow() {
    // 每次显示页面时更新语言
    this.updateLanguage();
  },

  // 更新页面语言
  updateLanguage() {
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      const currentLang = app.globalData.currentLang || 'zh';

      this.setData({
        currentLang,
        navTitle: t('nav.title'),
        searchPlaceholder: t('search.placeholder'),
        openingHoursTitle: t('openingHours.title'),
        openingHoursTime: t('openingHours.time'),
        openingHoursStatus: t('openingHours.status'),
        seatStatusTitle: t('seatStatus.title'),
        realTimeTitle: t('realTime.title'),
        recommendTitle: t('recommend.title'),
        viewAllText: t('common.btn.viewAll'),
        activityTitle: t('activity.title'),
        viewMoreActivity: t('common.btn.viewMore'),

        // 搜索标签
        searchTags: [
          t('search.tags.power'),
          t('search.tags.window'),
          t('search.tags.single'),
          t('search.tags.double'),
          t('search.tags.group'),
        ],

        // 功能卡片
        actionCards: [
          { icon: 'shopping-cart-o', text: t('common.btn.confirm') },
          { icon: 'home', text: t('actions.myReservation') },
          { icon: 'replay', text: t('actions.renew') },
          { icon: 'home', text: t('actions.checkin') },
        ],

        // 座位状态
        seatStatus: {
          total: { label: t('seatStatus.total'), value: '500' },
          available: { label: t('seatStatus.available'), value: '320', percent: '64%' },
          reserved: { label: t('seatStatus.reserved'), value: '150', percent: '30%' },
          maintenance: { label: t('seatStatus.maintenance'), value: '30', percent: '6%' },
        },

        // 实时信息
        realTimeItems: [
          {
            icon: 'home',
            label: t('realTime.users'),
            value: '280',
            sublabel: t('realTime.users.sublabel'),
            bgColor: '#e8f4ff',
            iconColor: '#409eff',
          },
          {
            icon: 'home',
            label: t('realTime.comfort'),
            value: '24℃',
            sublabel: t('realTime.comfort.sublabel'),
            bgColor: '#fff7e8',
            iconColor: '#e6a23c',
          },
          {
            icon: 'home',
            label: t('realTime.quiet'),
            value: '45dB',
            sublabel: t('realTime.quiet.sublabel'),
            bgColor: '#e8f9f0',
            iconColor: '#2ecc71',
          },
          {
            icon: 'home',
            label: t('realTime.popular'),
            value: 'A 区 2 楼',
            sublabel: t('realTime.popular.sublabel'),
            bgColor: '#ffe8e8',
            iconColor: '#e74c3c',
          },
          {
            icon: 'home',
            label: t('realTime.booked'),
            value: '156',
            sublabel: t('realTime.booked.sublabel'),
            bgColor: '#f3e8ff',
            iconColor: '#9b59b6',
          },
          {
            icon: 'home',
            label: t('realTime.total'),
            value: '325',
            sublabel: t('realTime.total.sublabel'),
            bgColor: '#e8f0ff',
            iconColor: '#3498db',
          },
        ],

        // 推荐座位
        seatList: [
          {
            seatLabel: t('seat.window'),
            seatName: 'A1',
            seatType: t('seat.type.single'),
            distance: '25m',
            status: 'available',
            icon: 'bag-o',
            statusText: t('common.status.available'),
            reserveText: t('common.btn.confirm'),
          },
          {
            seatLabel: t('seat.quiet'),
            seatName: 'B12',
            seatType: t('seat.type.single'),
            distance: '15m',
            status: 'available',
            icon: 'bag-o',
            statusText: t('common.status.available'),
            reserveText: t('common.btn.confirm'),
          },
          {
            seatLabel: t('seat.power'),
            seatName: 'C08',
            seatType: t('seat.type.double'),
            distance: '30m',
            status: 'available',
            icon: 'bag-o',
            statusText: t('common.status.available'),
            reserveText: t('common.btn.confirm'),
          },
        ],

        // 活动列表
        activityList: [
          {
            title: t('activity.marathon'),
            desc: t('activity.marathon.desc'),
            status: 'warning',
            statusText: t('common.status.ongoing'),
            btnText: t('common.btn.confirm'),
            time: '2026.01.05 - 2026.01.20',
            disabled: false,
          },
          {
            title: t('activity.sharing'),
            desc: t('activity.sharing.desc'),
            status: 'primary',
            statusText: t('common.status.pending'),
            btnText: t('common.btn.confirm'),
            time: '2026.01.15 - 2026.01.25',
            disabled: false,
          },
          {
            title: t('activity.retrieval'),
            desc: t('activity.retrieval.desc'),
            status: 'success',
            statusText: t('common.status.pending'),
            btnText: t('common.btn.confirm'),
            time: '2026.01.20 - 2026.01.22',
            disabled: false,
          },
          {
            title: t('activity.classic'),
            desc: t('activity.classic.desc'),
            status: 'default',
            statusText: t('common.status.completed'),
            btnText: t('common.btn.cancel'),
            time: '2025.12.20 - 2025.12.31',
            disabled: true,
          },
        ],
      });
    }
  },

  loadchart(data: number[]) {
    // 绑定组件（ec-canvas 标签的 id）
    const that = this as any;
    const ec_canvas = that.selectComponent('#echart');

    ec_canvas.init((canvas: any, width: number, height: number, dpr: number) => {
      try {
        if (!canvas || width === 0 || height === 0) {
          console.error('Canvas 参数异常');
          return null;
        }

        // 初始化图表
        const chart = echarts.init(canvas as any, undefined, {
          width,
          height,
          devicePixelRatio: dpr,
        });

        // echart 表格的内容配置 - 修改为柱形图
        var myoption = {
          title: {
            text: t('seatStatus.title'), // 使用多语言
            left: '16rpx',
            top: '16rpx',
            textStyle: {
              fontSize: 16,
              color: '#333',
              fontWeight: '600',
            },
          },
          grid: {
            left: 0,
            right: 0,
            bottom: 0,
            containLabel: true,
          },
          tooltip: {
            show: true,
            trigger: 'item',
            textStyle: {
              fontSize: 12,
            },
            padding: [4, 8],
          },
          xAxis: {
            type: 'category',
            data: ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
            axisLabel: {
              fontSize: 12,
              color: '#666',
              interval: 0,
              rotate: 0,
            },
            axisLine: {
              lineStyle: {
                color: '#e9ecef',
              },
            },
            axisTick: {
              show: false,
            },
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              fontSize: 12,
              color: '#666',
              margin: 6,
            },
            axisLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            splitLine: {
              lineStyle: {
                color: '#f0f0f0',
                type: 'dashed',
              },
            },
          },
          series: [
            {
              type: 'bar',
              data: data,
              barGap: '30%',
              barCategoryGap: '35%',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#409eff' },
                  { offset: 1, color: '#67b8ff' },
                ]),
              },
              emphasis: {
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#3a8ee6' },
                    { offset: 1, color: '#409eff' },
                  ]),
                },
              },
            },
          ],
        };

        chart.setOption(myoption);

        // 必须显式调用 resize() 触发重绘，否则图表可能不显示
        setTimeout(() => {
          chart.resize();
        }, 100);

        return chart;
      } catch (error) {
        console.error('ECharts 初始化失败:', error);
        throw error;
      }
    });
  },

  initchart(data: number[]) {
    // 传递后台数据到图表中，进行懒加载图表
    this.loadchart(data);
  },

  onReady() {
    let data = [15, 23, 38, 45, 52, 48, 35, 20];
    this.initchart(data);
  },

  /**
   * 座位预约事件
   */
  onSeatReserve(e: any) {
    const { seatLabel, seatName } = e.detail;
    wx.showToast({
      title: `${t('actions.reserve')} ${seatLabel}${seatName}`,
      icon: 'none',
    });
    // TODO: 跳转到预约页面
  },

  /**
   * 座位收藏事件
   */
  onSeatFavorite(e: any) {
    const { seatLabel, seatName } = e.detail;
    wx.showToast({
      title: `${t('actions.myReservation')} ${seatLabel}${seatName}`,
      icon: 'success',
    });
  },

  /**
   * 座位详情事件
   */
  onSeatDetail(e: any) {
    const { seatLabel, seatName } = e.detail;
    wx.showToast({
      title: `${t('common.btn.viewAll')} ${seatLabel}${seatName}`,
      icon: 'none',
    });
    // TODO: 跳转到座位详情页面
  },

  /**
   * 查看更多活动
   */
  onViewMoreActivities() {
    wx.showToast({
      title: t('activity.viewMore'),
      icon: 'none',
    });
    // TODO: 跳转到活动列表页面
  },

  /**
   * 活动按钮点击事件
   */
  onActivityBtnTap(e: any) {
    const index = e.currentTarget.dataset.index;
    const activity = this.data.activityList[index];
    if (activity && !activity.disabled) {
      wx.showToast({
        title: `${t('actions.reserve')} ${activity.title}`,
        icon: 'none',
      });
      // TODO: 跳转到活动详情或报名页面
    }
  },

  /**
   * 切换语言
   */
  onSwitchLanguage() {
    const app = getApp<IAppOption>();
    if (app && app.switchLanguage) {
      const currentLang = app.globalData.currentLang || 'zh';
      const newLang = currentLang === 'zh' ? 'en' : 'zh';
      app.switchLanguage(newLang);
    }
  },
});
