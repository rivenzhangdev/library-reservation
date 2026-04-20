// Reservation 页面中文语言包
export default {
  // 页面标题
  'reservation.title': '座位预约',

  // 楼层选择
  'reservation.floor.select': '选择楼层',
  'reservation.floor.all': '全部楼层',
  'reservation.floor.1f': '1 楼',
  'reservation.floor.2f': '2 楼',
  'reservation.floor.3f': '3 楼',
  'reservation.floor.4f': '4 楼',

  // 筛选相关
  'reservation.filter': '筛选',
  'reservation.filter.conditions': '筛选条件',
  'reservation.filter.area': '区域',
  'reservation.filter.seatType': '座位类型',
  'reservation.filter.facility': '设施',
  'reservation.filter.facility.power': '有插座',
  'reservation.filter.reset': '重置筛选条件',
  'reservation.filter.title': '筛选',
  'reservation.filter.result': '筛选结果',
  'reservation.hint.noMatchingSeats': '暂无匹配座位',
  'reservation.hint.invalidTimeSlot': '该时间段不可预约',
  'reservation.hint.invalidCustomTime': '自定义时间必须晚于当前时间',
  'reservation.hint.customTimeTooShort': '自定义时间段不得少于30分钟',
  'reservation.hint.customTimeSlotRange': '自定义时间必须在所选时间段范围内',
  'reservation.hint.customTimeSameAsSlot': '自定义时间不能等于完整时间段',
  'reservation.hint.customTimeHelp': '自定义时间段不得少于30分钟，且必须在当前时段内',

  // 区域选项
  'reservation.area.all': '全部区域',
  'reservation.area.a': 'A 区',
  'reservation.area.b': 'B 区',
  'reservation.area.c': 'C 区',

  // 座位类型选项
  'reservation.seatType.all': '全部类型',
  'reservation.seatType.single': '单人间',
  'reservation.seatType.double': '双人间',
  'reservation.seatType.group': '多人间',
  'reservation.seatType.open': '开放座位',

  // 搜索相关
  'reservation.search.placeholder': '搜索座位号...',

  // 时间选择
  'reservation.time.select': '选择时间',
  'reservation.time.period': '选择时段',
  'reservation.time.duration': '选择时长',
  'reservation.time.period.morning': '上午',
  'reservation.time.period.afternoon': '下午',
  'reservation.time.period.evening': '晚上',
  'reservation.time.period.custom': '自定义时段',
  'reservation.time.period.selectRange': '预约时段',
  'reservation.time.period.unknown': '未知时段',
  'reservation.time.duration.1h': '1 小时',
  'reservation.time.duration.2h': '2 小时',
  'reservation.time.duration.4h': '4 小时',
  'reservation.time.duration.allday': '全天',
  'reservation.time.date.placeholder': '请选择日期',
  'reservation.time.date.today': '今天',
  'reservation.time.date.tomorrow': '明天',
  'reservation.time.date.dayAfter': '后天',
  'reservation.time.date.selectMore': '选择更多日期',
  'reservation.time.noPeriods': '暂无可用预约时段，请选择其他日期',
  'reservation.time.custom.title': '自定义时间段',
  'reservation.time.custom.start': '开始时间',
  'reservation.time.custom.end': '结束时间',
  'reservation.time.custom.confirm': '确认时间段',
  'reservation.time.custom.cancel': '取消自定义时间段',

  // 预约确认
  'reservation.confirm.title': '预约确认',
  'reservation.confirm.seat': '选择座位',
  'reservation.confirm.date': '预约日期',
  'reservation.confirm.period': '预约时段',
  'reservation.confirm.duration': '预约时长',
  'reservation.confirm.fee': '费用',
  'reservation.confirm.button': '确认预约',

  // 提示信息
  'reservation.hint.seatSelected': '已{action}座位 {seatId}',
  'reservation.hint.selectSeat': '选择座位',
  'reservation.hint.cancelSeat': '取消选择',
  'reservation.hint.pleaseSelectDate': '请选择日期',
  'reservation.hint.pleaseSelectSeat': '请选择座位',
  'reservation.hint.reservationSuccess': '预约成功',
  'reservation.hint.subscribeMessageDeclined': '您已拒绝订阅消息，预约通知可能无法及时收到',
  'reservation.hint.endTimeMustAfterStart': '结束时间必须晚于开始时间',
  'reservation.hint.customTimeBothRequired': '开始时间和结束时间必须同时填写',
  'reservation.hint.customTimeConfirmed': '时间段已确认',
  'reservation.hint.customTimeCancelled': '已取消自定义时间段',

  // 座位选择组件
  'reservation.seatMap.title': '座位选择',
  'reservation.seatMap.subtitle': '点击选择或取消座位',
  'reservation.seatMap.window': '靠窗',
  'reservation.seatMap.legend.available.desc': '(可预约的座位)',
  'reservation.seatMap.legend.booked.desc': '(已被他人预约)',
  'reservation.seatMap.legend.maintenance.desc': '(暂时无法使用)',
  'reservation.seatMap.legend.selected.desc': '(您已选择的座位)',
  'reservation.seatMap.legend.mine.desc': '(您已预约的座位)',
  'reservation.seatMap.instruction': '点击可用座位进行选择，再次点击取消选择',
  'reservation.seatMap.tooltip.basic': '普通座位，点击查看更多位置信息。',
  'reservation.status.available': '可预约',
  'reservation.status.booked': '已预约',
  'reservation.status.maintenance': '维修中',
  'reservation.status.selected': '已选择',
  'reservation.info.bookedTimeRange': '已预约时间段',
  'reservation.info.timeRange': '时间段信息',
  'reservation.hint.reservationFailed': '预约失败，请稍后重试',
};
