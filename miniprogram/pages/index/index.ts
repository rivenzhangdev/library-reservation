// @ts-ignore
import * as echarts from '../../components/ec-canvas/echarts.min';

Page({
  data: {
    value: '',
    ec: {
      lazyLoad: true, // 启用懒加载模式，手动初始化图表
    } as any,
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
            text: '今日座位使用趋势',
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
      title: `预约 ${seatLabel}${seatName}`,
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
      title: `已收藏 ${seatLabel}${seatName}`,
      icon: 'success',
    });
  },

  /**
   * 座位详情事件
   */
  onSeatDetail(e: any) {
    const { seatLabel, seatName } = e.detail;
    wx.showToast({
      title: `查看 ${seatLabel}${seatName} 详情`,
      icon: 'none',
    });
    // TODO: 跳转到座位详情页面
  },

  /**
   * 查看更多活动
   */
  onViewMoreActivities() {
    wx.showToast({
      title: '查看更多活动',
      icon: 'none',
    });
    // TODO: 跳转到活动列表页面
  },
});
