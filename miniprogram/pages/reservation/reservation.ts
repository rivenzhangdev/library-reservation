Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 楼层数据（初始为空，在 initFloorData 中初始化）
    floors: [] as Array<{ id: number; name: string }>,
    currentFloor: 1,

    // 搜索
    searchValue: '',

    // 筛选面板
    showFilterPanel: false,

    // 筛选面板文案
    filterConditionsText: '',
    filterAreaText: '',
    filterSeatTypeText: '',
    filterFacilityText: '',
    filterFacilityPowerText: '',
    filterFacilityWindowText: '',
    filterResetText: '',

    // 区域选项（初始为空，在 initAreaData 中初始化）
    areas: [] as Array<{ id: string; name: string }>,
    selectedArea: { id: 'all', name: '' },

    // 座位类型选项（初始为空，在 initSeatTypeData 中初始化）
    seatTypes: [] as Array<{ id: string; name: string }>,
    selectedSeatType: { id: 'all', name: '' },

    // 设施选项
    facilities: {
      power: false,
      window: false,
    },

    // 座位数据
    seats: [] as any[],
    selectedSeatIds: [] as string[],

    // 主题
    theme: 'light',

    // 时间选择
    selectedDate: '',
    currentTimePeriod: 'morning',
    currentDuration: '2h',
    timePeriods: [] as Array<{ label: string; value: string }>,
    durations: [] as Array<{ label: string; value: string }>,

    // 预约确认
    selectedSeatText: '',
    currentTimePeriodText: '',
    currentDurationText: '',
    totalFee: 0,
    reservationInfoItems: [] as Array<{ label: string; value: string; highlight?: boolean }>,

    // 多语言支持
    languageClass: '',
    currentLang: 'zh' as 'zh' | 'en',
    navTitle: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 获取全局 App 实例
    const app = getApp();

    // 初始化语言类名和导航栏标题
    this.setData({
      languageClass: app.globalData.languageClass || 'lang-zh',
      navTitle: app.t('reservation.title'),
    });

    // 初始化所有需要多语言的数据
    this.initFloorData();
    this.initAreaData();
    this.initSeatTypeData();
    this.initFilterTexts();

    // 初始化时段和时长选项（使用多语言）
    this.initTimeOptions();

    // 初始化座位数据（示例）
    this.initSeats();

    // 初始化默认日期为今天
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    this.setData({
      selectedDate: today,
    });

    // 初始化预约信息列表
    this.updateReservationInfo();
  },

  /**
   * 初始化时段和时长选项
   */
  initTimeOptions() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const timePeriods = [
      { label: t('reservation.time.period.morning'), value: 'morning' },
      { label: t('reservation.time.period.afternoon'), value: 'afternoon' },
      { label: t('reservation.time.period.evening'), value: 'evening' },
    ];

    const durations = [
      { label: t('reservation.time.duration.1h'), value: '1h' },
      { label: t('reservation.time.duration.2h'), value: '2h' },
      { label: t('reservation.time.duration.4h'), value: '4h' },
      { label: t('reservation.time.duration.allday'), value: 'allday' },
    ];

    this.setData({
      timePeriods,
      durations,
      currentTimePeriodText: timePeriods[0].label,
      currentDurationText: durations[1].label,
    });
  },

  /**
   * 初始化筛选面板文案
   */
  initFilterTexts() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    this.setData({
      filterConditionsText: t('reservation.filter.conditions'),
      filterAreaText: t('reservation.filter.area'),
      filterSeatTypeText: t('reservation.filter.seatType'),
      filterFacilityText: t('reservation.filter.facility'),
      filterFacilityPowerText: t('reservation.filter.facility.power'),
      filterFacilityWindowText: t('reservation.filter.facility.window'),
      filterResetText: t('reservation.filter.reset'),
    });
  },

  /**
   * 更新语言
   */
  updateLanguage() {
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      const currentLang = app.globalData.currentLang || 'zh';

      // 更新语言类名、currentLang 和导航栏标题
      this.setData({
        languageClass: app.globalData.languageClass || 'lang-zh',
        currentLang: currentLang,
        navTitle: app.t('reservation.title'),
      });

      // 重新初始化所有需要多语言的数据
      this.initFloorData();
      this.initAreaData();
      this.initSeatTypeData();
      this.initFilterTexts();
      this.initTimeOptions();

      // 更新预约信息列表
      this.updateReservationInfo();
    }
  },

  /**
   * 初始化楼层数据
   */
  initFloorData() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const floors = [
      { id: 1, name: t('reservation.floor.1f') },
      { id: 2, name: t('reservation.floor.2f') },
      { id: 3, name: t('reservation.floor.3f') },
      { id: 4, name: t('reservation.floor.4f') },
    ];

    this.setData({ floors });
  },

  /**
   * 初始化区域数据
   */
  initAreaData() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const areas = [
      { id: 'all', name: t('reservation.area.all') },
      { id: 'a', name: t('reservation.area.a') },
      { id: 'b', name: t('reservation.area.b') },
      { id: 'c', name: t('reservation.area.c') },
    ];

    // 保持当前选中的区域
    const selectedArea = this.data.selectedArea;
    const currentArea = areas.find((a) => a.id === selectedArea.id) || areas[0];

    this.setData({
      areas,
      selectedArea: currentArea,
    });
  },

  /**
   * 初始化座位类型数据
   */
  initSeatTypeData() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const seatTypes = [
      { id: 'all', name: t('reservation.seatType.all') },
      { id: 'single', name: t('reservation.seatType.single') },
      { id: 'double', name: t('reservation.seatType.double') },
      { id: 'group', name: t('reservation.seatType.group') },
      { id: 'open', name: t('reservation.seatType.open') },
    ];

    // 保持当前选中的座位类型
    const selectedSeatType = this.data.selectedSeatType;
    const currentSeatType = seatTypes.find((s) => s.id === selectedSeatType.id) || seatTypes[0];

    this.setData({
      seatTypes,
      selectedSeatType: currentSeatType,
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查语言是否变化，避免重复初始化
    const app = getApp();
    const currentLang = app.globalData.currentLang || 'zh';

    if (currentLang !== this.data.currentLang) {
      this.updateLanguage();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 楼层选择事件
   */
  onFloorTap(e: any) {
    const floorId = e.currentTarget.dataset.id;
    this.setData({
      currentFloor: floorId,
    });
    // 这里可以添加切换楼层后的数据加载逻辑
    console.log('切换楼层:', floorId);
  },

  /**
   * 筛选按钮点击事件
   */
  onFilterTap() {
    this.setData({
      showFilterPanel: !this.data.showFilterPanel,
    });
  },

  /**
   * 搜索内容变化事件
   */
  onSearchChange(e: any) {
    this.setData({
      searchValue: e.detail,
    });
    // 可以添加防抖搜索逻辑
    console.log('搜索:', e.detail);
  },

  /**
   * 区域选择事件
   */
  onAreaTap() {
    // 这里可以弹出选择器供用户选择区域
    wx.showActionSheet({
      itemList: this.data.areas.map((item) => item.name),
      success: (res) => {
        const index = res.tapIndex;
        this.setData({
          selectedArea: this.data.areas[index],
        });
      },
    });
  },

  /**
   * 座位类型选择事件
   */
  onSeatTypeTap() {
    // 这里可以弹出选择器供用户选择座位类型
    wx.showActionSheet({
      itemList: this.data.seatTypes.map((item) => item.name),
      success: (res) => {
        const index = res.tapIndex;
        this.setData({
          selectedSeatType: this.data.seatTypes[index],
        });
      },
    });
  },

  /**
   * 设施选项切换事件
   */
  onFacilityTap(e: any) {
    const type = e.currentTarget.dataset.type as 'power' | 'window';
    const facilities = { ...this.data.facilities };
    facilities[type] = !facilities[type];
    this.setData({
      facilities,
    });
    console.log('设施选择:', facilities);
  },

  /**
   * 重置筛选条件
   */
  onResetFilter() {
    this.setData({
      selectedArea: { id: 'all', name: '全部区域' },
      selectedSeatType: { id: 'all', name: '全部类型' },
      facilities: {
        power: false,
        window: false,
      },
    });
  },

  /**
   * 初始化座位数据
   */
  initSeats() {
    // 生成示例座位数据
    const seats = [];
    for (let row = 1; row <= 5; row++) {
      for (let col = 1; col <= 8; col++) {
        const statusRand = Math.random();
        let status: 'available' | 'booked' | 'maintenance' | 'selected' | 'mine' = 'available';

        if (statusRand > 0.7) {
          status = 'booked';
        } else if (statusRand > 0.9) {
          status = 'maintenance';
        }

        seats.push({
          id: `${row}-${col}`,
          row,
          col,
          status,
          type: col % 3 === 0 ? 'double' : 'single',
          hasSocket: col % 2 === 0,
          isWindow: col === 1 || col === 8,
          zone: col <= 4 ? 'A 区' : 'B 区',
        });
      }
    }

    this.setData({ seats });
  },

  /**
   * 处理座位选择事件
   */
  onSeatSelect(e: any) {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const { seatId, seat } = e.detail;
    const selectedSeatIds = [...this.data.selectedSeatIds];

    // 如果已经选中，则取消选中
    const index = selectedSeatIds.indexOf(seatId);
    if (index > -1) {
      selectedSeatIds.splice(index, 1);
    } else {
      // 否则添加选中
      selectedSeatIds.push(seatId);
    }

    // 更新选中的座位文本
    const selectedSeatText = selectedSeatIds.join(', ');

    // 计算费用
    const totalFee = this.calculateFee(selectedSeatIds.length);

    this.setData({
      selectedSeatIds,
      selectedSeatText,
      totalFee,
    });

    // 更新预约信息列表
    this.updateReservationInfo();

    console.log('座位选择:', seatId, seat, '已选座位:', selectedSeatIds);

    // 可以在这里调用预约接口
    const action = index > -1 ? t('reservation.hint.cancelSeat') : t('reservation.hint.selectSeat');
    const title = t('reservation.hint.seatSelected', { action, seatId: seatId });

    wx.showToast({
      title,
      icon: 'none',
    });
  },

  /**
   * 日期选择点击
   */
  onDateClick() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // 使用多语言
    const itemList = [
      t('reservation.time.date.today'),
      t('reservation.time.date.tomorrow'),
      t('reservation.time.date.dayAfter'),
      t('reservation.time.date.selectMore'),
    ];

    // 使用小程序的日期选择器
    wx.showActionSheet({
      itemList,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.setData({ selectedDate: today });
        } else if (res.tapIndex === 1) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
          this.setData({ selectedDate: tomorrowStr });
        } else if (res.tapIndex === 2) {
          const dayAfter = new Date(now);
          dayAfter.setDate(dayAfter.getDate() + 2);
          const dayAfterStr = `${dayAfter.getFullYear()}-${String(dayAfter.getMonth() + 1).padStart(2, '0')}-${String(dayAfter.getDate()).padStart(2, '0')}`;
          this.setData({ selectedDate: dayAfterStr });
        } else {
          // 这里可以打开一个自定义的日期选择器页面
          wx.showToast({
            title: t('reservation.hint.pleaseSelectDate'),
            icon: 'none',
          });
        }
        console.log('选择日期:', this.data.selectedDate);
      },
    });
  },

  /**
   * 时段选择
   */
  onTimePeriodTap(e: any) {
    const { value } = e.currentTarget.dataset;

    // 从 timePeriods 中查找对应的文本
    const period = this.data.timePeriods.find((p) => p.value === value);
    const periodText = period ? period.label : '';

    this.setData({
      currentTimePeriod: value,
      currentTimePeriodText: periodText,
    });

    // 更新预约信息列表
    this.updateReservationInfo();

    console.log('选择时段:', value);
  },

  /**
   * 时长选择
   */
  onDurationTap(e: any) {
    const { value } = e.currentTarget.dataset;

    // 从 durations 中查找对应的文本
    const duration = this.data.durations.find((d) => d.value === value);
    const durationText = duration ? duration.label : '';

    this.setData({
      currentDuration: value,
      currentDurationText: durationText,
    });

    // 更新预约信息列表
    this.updateReservationInfo();

    console.log('选择时长:', value);
  },

  /**
   * 计算费用
   */
  calculateFee(seatCount: number): number {
    // 基础费率：每小时 5 元
    const hourlyRate = 5;

    // 根据时长计算费用
    let hours = 0;
    switch (this.data.currentDuration) {
      case '1h':
        hours = 1;
        break;
      case '2h':
        hours = 2;
        break;
      case '4h':
        hours = 4;
        break;
      case 'allday':
        hours = 8; // 全天按 8 小时计算
        break;
      default:
        hours = 2;
    }

    // 总费用 = 单价 × 时长 × 座位数
    const totalFee = hourlyRate * hours * seatCount;

    return totalFee;
  },

  /**
   * 更新预约信息列表
   */
  updateReservationInfo() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const items = [
      { label: t('reservation.confirm.seat'), value: this.data.selectedSeatText || '-' },
      { label: t('reservation.confirm.date'), value: this.data.selectedDate || '-' },
      { label: t('reservation.confirm.period'), value: this.data.currentTimePeriodText },
      { label: t('reservation.confirm.duration'), value: this.data.currentDurationText },
      { label: t('reservation.confirm.fee'), value: `¥${this.data.totalFee}`, highlight: true },
    ];

    this.setData({
      reservationInfoItems: items,
    });
  },

  /**
   * 确认预约
   */
  onConfirmReservation() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const { selectedSeatIds, selectedDate, currentTimePeriodText, currentDurationText, totalFee } =
      this.data;

    if (selectedSeatIds.length === 0) {
      wx.showToast({
        title: t('reservation.hint.pleaseSelectSeat') || '请选择座位',
        icon: 'none',
      });
      return;
    }

    if (!selectedDate) {
      wx.showToast({
        title: t('reservation.hint.pleaseSelectDate'),
        icon: 'none',
      });
      return;
    }

    // 更新预约信息（确保是最新的）
    this.updateReservationInfo();

    // 显示确认对话框
    wx.showModal({
      title: t('reservation.confirm.title'),
      content: `${t('reservation.confirm.seat')}: ${this.data.selectedSeatText}\n${t('reservation.confirm.date')}: ${selectedDate}\n${t('reservation.confirm.period')}: ${currentTimePeriodText}\n${t('reservation.confirm.duration')}: ${currentDurationText}\n${t('reservation.confirm.fee')}: ¥${totalFee}`,
      confirmText: t('reservation.confirm.button'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (res.confirm) {
          // 这里调用预约接口
          console.log('提交预约:', {
            seats: selectedSeatIds,
            date: selectedDate,
            period: this.data.currentTimePeriod,
            duration: this.data.currentDuration,
          });

          wx.showToast({
            title: t('reservation.hint.reservationSuccess') || t('common.hint.success'),
            icon: 'success',
          });
        }
      },
    });
  },

  /**
   * 处理座位选择错误
   */
  onSeatError(e: any) {
    const { seatId, message } = e.detail;
    console.error('座位选择错误:', seatId, message);

    wx.showToast({
      title: message,
      icon: 'none',
    });
  },
});
