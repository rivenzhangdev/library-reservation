import { getFloors, getFloorSeats } from '../../apis/seats';
import { createBooking } from '../../apis/booking';
import { ensureBoundStudentInfo, isLogin } from '../../utils/auth';
import { consumePendingReservationParams } from '../../utils/reservationNavigator';
import { sortByFloorName, sortBySeatPosition } from '../../utils/sort';

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
    filterResultText: '',
    noSeatText: '',

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
    timePeriods: [] as Array<{ label: string; value: string; start: string; end: string }>,
    durations: [] as Array<{ label: string; value: string }>,

    // 自定义时间段
    showCustomTime: false,
    startTime: '08:00',
    endTime: '12:00',
    customStartTime: '',
    customEndTime: '',
    customTimePeriodText: '',

    // 预约确认
    selectedSeatText: '',
    currentTimePeriodText: '',
    currentDurationText: '',
    reservationInfoItems: [] as Array<{ label: string; value: string; highlight?: boolean }>,

    // 多语言支持
    languageClass: '',
    currentLang: 'zh' as 'zh' | 'en',
    navTitle: '',

    // 多语言文案
    floorSelectText: '',
    timeSelectText: '',
    timePeriodText: '',
    timeDurationText: '',
    filterText: '',
    searchPlaceholderText: '',
    confirmTitleText: '',
    confirmButtonText: '',
    customTimeCancelText: '',
    customTimeConfirmText: '',
    timeRangeLabelText: '',
    customTimeStartText: '',
    customTimeEndText: '',
    seatCount: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
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

    // 处理从收藏页面传递的参数
    if (options && Object.keys(options).length > 0) {
      this.handleFavoriteParams(options);
    }

    this.consumePendingReservationParams();
  },

  /**
   * 处理从收藏页面传递的参数
   */
  handleFavoriteParams(options: any) {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    console.log('handleFavoriteParams 接收到参数:', options);

    // 处理座位参数
    if (options.seatId) {
      const { seatId, seatName, seatCode, zone, floor, type, facilities } = options;

      console.log('接收到座位参数:', { seatId, seatName, seatCode, zone, floor, type, facilities });

      // 解析楼层
      if (floor) {
        const floorId = Number(String(floor).replace(/[^\d]/g, ''));
        if (!Number.isNaN(floorId) && floorId > 0) {
          this.setData({ currentFloor: floorId });
        }
      }

      // 解析区域
      if (zone) {
        const zoneMap: Record<string, string> = {
          'A 区': 'a',
          'B 区': 'b',
          'C 区': 'c',
        };
        const areaId = zoneMap[zone] || 'all';
        const area = this.data.areas.find((a) => a.id === areaId) || this.data.areas[0];
        this.setData({ selectedArea: area });
      }

      // 解析座位类型
      if (type) {
        const typeMap: Record<string, string> = {
          阅览区单人桌: 'single',
          自习区讨论桌: 'double',
          研修室: 'group',
          电子阅览区: 'open',
        };
        const seatTypeId = typeMap[type] || 'all';
        const seatType =
          this.data.seatTypes.find((s) => s.id === seatTypeId) || this.data.seatTypes[0];
        this.setData({ selectedSeatType: seatType });
      }

      // 解析设施
      if (facilities) {
        const facilitiesArr = facilities.split(',');
        const facilitiesConfig: any = {
          power: false,
          window: false,
        };

        if (facilitiesArr.includes(t('common.seat.facilities.power'))) {
          facilitiesConfig.power = true;
        }
        if (facilitiesArr.includes(t('common.seat.facilities.window'))) {
          facilitiesConfig.window = true;
        }

        this.setData({ facilities: facilitiesConfig });
      }

      // 自动选择座位
      if (seatId) {
        const seat = this.data.seats.find((s) => s.id === seatId || s.seatCode === seatCode);
        this.setData({
          selectedSeatIds: [String(seatId)],
          selectedSeatText: seatName || seat?.id || String(seatId),
        });
        if (seat) {
          this.updateReservationInfo();

          wx.showToast({
            title: `已自动选择：${seatName || seatId}`,
            icon: 'success',
            duration: 2000,
          });
        }
      }
    }

    // 处理时段参数
    if (options.startTime && options.endTime) {
      const { startTime, endTime, timeSlotName } = options;

      console.log('接收到时段参数:', { startTime, endTime, timeSlotName });

      // 计算时长（小时）
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const durationMs = end.getTime() - start.getTime();
      const hours = durationMs / (1000 * 60 * 60);
      const durationValue = `${Math.ceil(hours)}h`;

      // 查找对应的时长文本
      const duration = this.data.durations.find((d) => d.value === durationValue);
      const durationText = duration ? duration.label : `${Math.ceil(hours)}小时`;

      // 设置为自定义时间段
      this.setData({
        customStartTime: startTime,
        customEndTime: endTime,
        customTimePeriodText: `${startTime} - ${endTime}`,
        currentTimePeriod: 'custom',
        currentTimePeriodText: t('reservation.time.period.custom') || '自定义时段',
        currentDurationText: durationText,
        showCustomTime: false,
      });

      console.log('设置后的数据:', {
        customStartTime: startTime,
        customEndTime: endTime,
        currentTimePeriod: 'custom',
        currentDurationText: durationText,
      });

      // 更新预约信息列表
      this.updateReservationInfo();

      wx.showToast({
        title: `已设置时段：${startTime} - ${endTime}（${durationText}）`,
        icon: 'success',
        duration: 2000,
      });
    }
  },

  /**
   * 初始化时段和时长选项
   */
  initTimeOptions() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const timePeriods = [
      {
        label: t('reservation.time.period.morning'),
        value: 'morning',
        start: '08:00',
        end: '12:00',
      },
      {
        label: t('reservation.time.period.afternoon'),
        value: 'afternoon',
        start: '13:00',
        end: '17:00',
      },
      {
        label: t('reservation.time.period.evening'),
        value: 'evening',
        start: '18:00',
        end: '22:00',
      },
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
      customTimePeriodText: `${timePeriods[0].start} - ${timePeriods[0].end}`,
      // 更新多语言文案
      floorSelectText: t('reservation.floor.select'),
      timeSelectText: t('reservation.time.select'),
      timePeriodText: t('reservation.time.period'),
      timeDurationText: t('reservation.time.duration'),
      filterText: t('reservation.filter'),
      searchPlaceholderText: t('reservation.search.placeholder'),
      confirmTitleText: t('reservation.confirm.title'),
      confirmButtonText: t('reservation.confirm.button'),
      customTimeCancelText: t('reservation.time.custom.cancel'),
      customTimeConfirmText: t('reservation.time.custom.confirm'),
      timeRangeLabelText: t('reservation.time.period.selectRange'),
      customTimeStartText: t('reservation.time.custom.start'),
      customTimeEndText: t('reservation.time.custom.end'),
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
      filterFacilityWindowText: t('common.seat.facilities.window'),
      filterResetText: t('reservation.filter.reset'),
      filterResultText:
        t('reservation.filter.result') ||
        (this.data.currentLang === 'zh' ? '筛选结果' : 'Filter results'),
      noSeatText:
        t('reservation.hint.noMatchingSeats') ||
        (this.data.currentLang === 'zh' ? '暂无匹配座位' : 'No matching seats'),
      filterText: t('reservation.filter.title'),
      searchPlaceholderText: t('reservation.search.placeholder'),
      confirmTitleText: t('reservation.confirm.title'),
      confirmButtonText: t('reservation.confirm.button'),
      customTimeCancelText: t('reservation.hint.customTimeCancelled'),
      customTimeConfirmText: t('reservation.hint.customTimeConfirmed'),
      timeRangeLabelText: t('reservation.time.period.selectRange'),
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
   * 初始化楼层数据（从后端加载）
   */
  initFloorData() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    getFloors()
      .then((res) => {
        const floorsData = res.data as any[];
        if (Array.isArray(floorsData) && floorsData.length > 0) {
          const floors = sortByFloorName(floorsData.map((f: any) => ({ id: f.id, name: f.name })));
          this.setData({ floors, currentFloor: floors[0]?.id ?? this.data.currentFloor });
          // 加载第一个楼层的座位
          this.loadSeats();
        }
      })
      .catch(() => {
        // fallback to hardcoded floors
        const floors = [
          { id: 1, name: t('reservation.floor.1f') },
          { id: 2, name: t('reservation.floor.2f') },
          { id: 3, name: t('reservation.floor.3f') },
          { id: 4, name: t('reservation.floor.4f') },
        ];
        this.setData({ floors });
        this.loadSeats();
      });
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

    this.consumePendingReservationParams();
  },

  consumePendingReservationParams() {
    try {
      const pendingParams = consumePendingReservationParams() as Record<string, any> | null;
      if (pendingParams && Object.keys(pendingParams).length > 0) {
        this.handleFavoriteParams(pendingParams);
      }
    } catch (error) {
      console.error('读取待处理预约参数失败:', error);
    }
  },

  resolveTimeSlotValue() {
    if (this.data.currentTimePeriod !== 'custom') {
      const timeSlotMap: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
      return timeSlotMap[this.data.currentTimePeriod] ?? 0;
    }

    const referenceTime = this.data.customStartTime || this.data.startTime || '08:00';
    const hour = Number(referenceTime.split(':')[0] || 0);

    if (hour >= 18) return 2;
    if (hour >= 13) return 1;
    return 0;
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
      selectedSeatIds: [],
      selectedSeatText: '',
    });
    this.loadSeats();
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
    const value =
      typeof e.detail === 'string'
        ? e.detail
        : typeof e.detail?.value === 'string'
          ? e.detail.value
          : '';

    this.setData({
      searchValue: value,
    });
    this.debounceLoadSeats();
  },

  /**
   * 搜索确认事件
   */
  onSearchConfirm(e: any) {
    const keyword =
      typeof e.detail === 'string'
        ? e.detail
        : typeof e.detail?.value === 'string'
          ? e.detail.value
          : '';

    this.setData({
      searchValue: keyword,
    });
    this.loadSeats();
  },

  debounceLoadSeats() {
    clearTimeout((this as any).seatSearchTimer);
    (this as any).seatSearchTimer = setTimeout(() => {
      this.loadSeats();
    }, 250);
  },

  /**
   * 区域选择事件
   */
  onAreaTap() {
    wx.showActionSheet({
      itemList: this.data.areas.map((item) => item.name),
      success: (res) => {
        const index = res.tapIndex;
        this.setData({
          selectedArea: this.data.areas[index],
        });
        this.loadSeats();
      },
    });
  },

  /**
   * 座位类型选择事件
   */
  onSeatTypeTap() {
    wx.showActionSheet({
      itemList: this.data.seatTypes.map((item) => item.name),
      success: (res) => {
        const index = res.tapIndex;
        this.setData({
          selectedSeatType: this.data.seatTypes[index],
        });
        this.loadSeats();
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
    this.loadSeats();
  },

  /**
   * 重置筛选条件
   */
  onResetFilter() {
    this.setData({
      selectedArea: { id: 'all', name: this.data.areas[0]?.name || '' },
      selectedSeatType: { id: 'all', name: this.data.seatTypes[0]?.name || '' },
      facilities: {
        power: false,
        window: false,
      },
    });
    this.loadSeats();
  },

  /**
   * 初始化座位数据（兼容，调用 loadSeats）
   */
  initSeats() {
    this.loadSeats();
  },

  /**
   * 从后端加载座位数据
   */
  loadSeats() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);
    const {
      currentFloor,
      selectedDate,
      currentTimePeriod,
      selectedArea,
      selectedSeatType,
      facilities,
      searchValue,
    } = this.data;

    // 构造时段值
    const timeSlotMap: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
    const timeSlot = timeSlotMap[currentTimePeriod];

    // 构造筛选条件
    const filters: any = {};
    if (selectedArea && selectedArea.id !== 'all') {
      filters.zone = selectedArea.name;
    }
    if (selectedSeatType && selectedSeatType.id !== 'all') {
      const typeMap: Record<string, number> = { single: 0, double: 1, group: 2, open: 0 };
      filters.type = typeMap[selectedSeatType.id] ?? 0;
    }
    if (facilities.power) filters.hasSocket = true;
    if (facilities.window) filters.isWindow = true;

    const params: any = {};
    if (selectedDate) params.date = selectedDate;
    if (timeSlot !== undefined && currentTimePeriod !== 'custom') params.timeSlot = timeSlot;
    if (Object.keys(filters).length > 0) params.filters = JSON.stringify(filters);

    getFloorSeats(String(currentFloor), params)
      .then((res) => {
        const responseData = res.data as any;
        if (responseData?.seats) {
          const statusMap: Record<string, string> = {
            '0': 'available',
            '1': 'booked',
            '2': 'maintenance',
            available: 'available',
            booked: 'booked',
            maintenance: 'maintenance',
          };
          const typeMap: Record<string, string> = {
            '0': 'single',
            '1': 'double',
            '2': 'group',
          };
          let seats = responseData.seats.map((s: any) => ({
            id: String(s.id),
            row: s.row,
            col: s.col,
            status: statusMap[String(s.status)] || 'available',
            type: typeMap[String(s.type)] || 'single',
            hasSocket: !!s.hasSocket,
            isWindow: !!s.isWindow,
            zone: s.zone || '',
            bookedTimeRange: '',
          }));
          const keyword = String(searchValue || '')
            .trim()
            .toLowerCase();
          if (keyword) {
            seats = seats.filter((seat: any) => {
              const searchable = [
                seat.id,
                seat.zone,
                seat.row,
                seat.col,
                seat.type,
                seat.type === 'single' ? t('reservation.seatType.single') : '',
                seat.type === 'double' ? t('reservation.seatType.double') : '',
                seat.type === 'group' ? t('reservation.seatType.group') : '',
                seat.hasSocket ? 'power' : '',
                seat.hasSocket ? t('common.seat.facilities.power') : '',
                seat.isWindow ? 'window' : '',
                seat.isWindow ? t('common.seat.facilities.window') : '',
              ]
                .join(' ')
                .toLowerCase();
              return searchable.includes(keyword);
            });
          }
          seats = sortBySeatPosition(seats);
          const selectedSeatId = this.data.selectedSeatIds[0];
          const matchedSeat = selectedSeatId
            ? seats.find((seat: any) => seat.id === selectedSeatId)
            : null;
          this.setData({
            seats,
            seatCount: seats.length,
            selectedSeatIds: matchedSeat ? [matchedSeat.id] : this.data.selectedSeatIds,
            selectedSeatText: matchedSeat
              ? this.data.selectedSeatText || matchedSeat.id
              : this.data.selectedSeatText,
          });

          if (seats.length === 0) {
            const keyword = String(searchValue || '').trim();
            if (
              keyword ||
              selectedArea?.id !== 'all' ||
              selectedSeatType?.id !== 'all' ||
              facilities.power ||
              facilities.window
            ) {
              wx.showToast({
                title: this.data.noSeatText || '暂无匹配座位',
                icon: 'none',
                duration: 1800,
              });
            }
          }

          this.updateReservationInfo();
        }
      })
      .catch((err) => {
        console.error('加载座位失败:', err);
        wx.showToast({ title: '加载座位失败', icon: 'none' });
      });
  },

  /**
   * 处理座位选择事件
   */
  onSeatSelect(e: any) {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const { seatId, seat } = e.detail;

    // 如果点击的是已预约的座位，只显示提示信息，不允许选择
    if (seat.status === 'booked' || seat.status === 'mine') {
      const timeRange = seat.bookedTimeRange || t('reservation.time.period.unknown');
      wx.showToast({
        title: `${seatId}: ${timeRange}`,
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    // 每次只能选择一个座位
    const selectedSeatIds = [seatId];
    const selectedSeatText = seatId;

    this.setData({
      selectedSeatIds,
      selectedSeatText,
    });

    // 更新预约信息列表
    this.updateReservationInfo();

    console.log('座位选择:', seatId, seat, '已选座位:', selectedSeatIds);

    // 显示选择提示和当前选择的时段
    const timeRange = this.data.customTimePeriodText;
    const timeInfo = `${t('reservation.time.period.selectRange') || '预约时段'}: ${timeRange}`;

    wx.showToast({
      title: `${t('reservation.hint.selectSeat')}\n${timeInfo}`,
      icon: 'none',
      duration: 2000,
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
        this.updateReservationInfo();
        this.loadSeats();
      },
    });
  },

  /**
   * 时段选择
   */
  onTimePeriodTap(e: any) {
    const { value } = e.currentTarget.dataset;

    // 从 timePeriods 中查找对应的文本和时间范围
    const period = this.data.timePeriods.find((p) => p.value === value);
    const periodText = period ? period.label : '';
    const timeRangeText = period ? `${period.start} - ${period.end}` : '';

    this.setData({
      currentTimePeriod: value,
      currentTimePeriodText: periodText,
      customTimePeriodText: timeRangeText,
      showCustomTime: false,
    });

    // 更新预约信息列表
    this.updateReservationInfo();
    this.loadSeats();

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
   * 切换自定义时间段
   */
  toggleCustomTime() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    this.setData({
      showCustomTime: !this.data.showCustomTime,
    });

    if (!this.data.showCustomTime) {
      wx.showToast({
        title: t('reservation.hint.customTimeCancelled') || '已取消自定义时间段',
        icon: 'none',
      });
    }
  },

  /**
   * 开始时间变化
   */
  onStartTimeChange(e: any) {
    const startTime = e.detail;
    this.setData({ startTime });
  },

  /**
   * 结束时间变化
   */
  onEndTimeChange(e: any) {
    const endTime = e.detail;
    this.setData({ endTime });
  },

  /**
   * 确认自定义时间段
   */
  onConfirmCustomTime() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    const { startTime, endTime } = this.data;

    // 验证结束时间必须晚于开始时间
    if (startTime >= endTime) {
      wx.showToast({
        title: t('reservation.hint.endTimeMustAfterStart') || '结束时间必须晚于开始时间',
        icon: 'none',
      });
      return;
    }

    this.setData({
      customStartTime: startTime,
      customEndTime: endTime,
      customTimePeriodText: `${startTime} - ${endTime}`,
      showCustomTime: false,
      currentTimePeriod: 'custom',
      currentTimePeriodText: t('reservation.time.period.custom') || '自定义时段',
    });

    // 更新预约信息列表
    this.updateReservationInfo();

    wx.showToast({
      title: t('reservation.hint.customTimeConfirmed') || '时间段已确认',
      icon: 'success',
    });
  },

  /**
   * 更新预约信息列表
   */
  updateReservationInfo() {
    const app = getApp() as any;
    const t = app.t || ((key: string) => key);

    // 使用实际的预约时间范围
    let periodValue = this.data.currentTimePeriodText;
    if (this.data.currentTimePeriod === 'custom') {
      periodValue = `${this.data.customStartTime} - ${this.data.customEndTime}`;
    }

    const items = [
      { label: t('reservation.confirm.seat'), value: this.data.selectedSeatText || '-' },
      { label: t('reservation.confirm.date'), value: this.data.selectedDate || '-' },
      { label: t('reservation.confirm.period'), value: periodValue },
      { label: t('reservation.confirm.duration'), value: this.data.currentDurationText },
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

    const { selectedSeatIds, selectedDate, currentTimePeriodText, currentDurationText } = this.data;

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
      content: `${t('reservation.confirm.seat')}: ${this.data.selectedSeatText}\n${t('reservation.confirm.date')}: ${selectedDate}\n${t('reservation.confirm.period')}: ${currentTimePeriodText}\n${t('reservation.confirm.duration')}: ${currentDurationText}`,
      confirmText: t('reservation.confirm.button'),
      cancelText: t('common.btn.cancel'),
      success: (res) => {
        if (res.confirm) {
          // 构建预约参数
          const seatId = selectedSeatIds[0];
          const timePeriod = this.resolveTimeSlotValue();

          // 获取开始和结束时间
          let startTime = '';
          let endTime = '';
          if (this.data.currentTimePeriod === 'custom') {
            startTime = this.data.customStartTime;
            endTime = this.data.customEndTime;
          } else {
            const period = this.data.timePeriods.find(
              (p: any) => p.value === this.data.currentTimePeriod
            );
            if (period) {
              startTime = period.start;
              endTime = period.end;
            }
          }

          if (!isLogin()) {
            wx.showToast({ title: t('common.hint.pleaseLogin') || '请先登录', icon: 'none' });
            return;
          }

          if (!ensureBoundStudentInfo()) {
            return;
          }

          createBooking({
            seatId: parseInt(seatId),
            date: selectedDate,
            timeSlot: timePeriod,
            startTime,
            endTime,
          })
            .then(() => {
              wx.showToast({
                title: t('reservation.hint.reservationSuccess') || t('common.hint.success'),
                icon: 'success',
                duration: 1500,
              });

              // 预约成功后重新加载座位并跳转
              this.loadSeats();
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/my-reservation/my-reservation',
                });
              }, 1500);
            })
            .catch((err) => {
              console.error('预约失败:', err);
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
