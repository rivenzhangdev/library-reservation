// Reservation page English language pack
export default {
  // Page title
  'reservation.title': 'Seat Reservation',

  // Floor selection
  'reservation.floor.select': 'Select Floor',
  'reservation.floor.1f': '1F',
  'reservation.floor.2f': '2F',
  'reservation.floor.3f': '3F',
  'reservation.floor.4f': '4F',

  // Filter related
  'reservation.filter': 'Filter',
  'reservation.filter.conditions': 'Filter Conditions',
  'reservation.filter.area': 'Area',
  'reservation.filter.seatType': 'Seat Type',
  'reservation.filter.facility': 'Facilities',
  'reservation.filter.facility.power': 'With Socket',
  'reservation.filter.reset': 'Reset Filters',
  'reservation.filter.title': 'Filter',
  'reservation.filter.result': 'Filter results',
  'reservation.hint.noMatchingSeats': 'No matching seats',
  'reservation.hint.invalidTimeSlot': 'This time slot cannot be booked',
  'reservation.hint.invalidCustomTime': 'Custom time must be in the future',
  'reservation.hint.customTimeTooShort': 'Custom time must be at least 30 minutes',
  'reservation.hint.customTimeSlotRange': 'Custom time must be within the selected time period',
  'reservation.hint.customTimeSameAsSlot': 'Custom time cannot equal the full time period',
  'reservation.hint.customTimeBothRequired': 'Both start time and end time are required',
  'reservation.hint.customTimeHelp':
    'Custom time must be at least 30 minutes and within the current time period',

  // Area options
  'reservation.area.all': 'All Areas',
  'reservation.area.a': 'Area A',
  'reservation.area.b': 'Area B',
  'reservation.area.c': 'Area C',

  // Seat type options
  'reservation.seatType.all': 'All Types',
  'reservation.seatType.single': 'Single Room',
  'reservation.seatType.double': 'Double Room',
  'reservation.seatType.group': 'Group Room',
  'reservation.seatType.open': 'Open Seat',

  // Search related
  'reservation.search.placeholder': 'Search seat number...',

  // Time selection
  'reservation.time.select': 'Select Time',
  'reservation.time.period': 'Time Period',
  'reservation.time.duration': 'Duration',
  'reservation.time.period.morning': 'Morning',
  'reservation.time.period.afternoon': 'Afternoon',
  'reservation.time.period.evening': 'Evening',
  'reservation.time.period.custom': 'Custom Period',
  'reservation.time.period.selectRange': 'Time Range',
  'reservation.time.period.unknown': 'Unknown Time',
  'reservation.time.duration.1h': '1 Hour',
  'reservation.time.duration.2h': '2 Hours',
  'reservation.time.duration.4h': '4 Hours',
  'reservation.time.duration.allday': 'All Day',
  'reservation.time.date.placeholder': 'Select Date',
  'reservation.time.date.today': 'Today',
  'reservation.time.date.tomorrow': 'Tomorrow',
  'reservation.time.date.dayAfter': 'Day After Tomorrow',
  'reservation.time.date.selectMore': 'Select More Dates',
  'reservation.time.noPeriods': 'No available time slots, please choose another date',
  'reservation.time.custom.title': 'Custom Time Period',
  'reservation.time.custom.start': 'Start Time',
  'reservation.time.custom.end': 'End Time',
  'reservation.time.custom.confirm': 'Confirm Time Period',
  'reservation.time.custom.cancel': 'Cancel Custom Period',

  // Reservation confirmation
  'reservation.confirm.title': 'Reservation Confirmation',
  'reservation.confirm.seat': 'Seat',
  'reservation.confirm.date': 'Date',
  'reservation.confirm.period': 'Time Period',
  'reservation.confirm.duration': 'Duration',
  'reservation.confirm.fee': 'Fee',
  'reservation.confirm.button': 'Confirm Reservation',

  // Hints
  'reservation.hint.seatSelected': 'Seat {seatId} {action}',
  'reservation.hint.selectSeat': 'selected',
  'reservation.hint.cancelSeat': 'cancelled',
  'reservation.hint.pleaseSelectDate': 'Please select date',
  'reservation.hint.pleaseSelectSeat': 'Please select a seat',
  'reservation.hint.reservationSuccess': 'Reservation successful',
  'reservation.hint.subscribeMessageDeclined':
    'Subscription declined, reservation notifications may not arrive',
  'reservation.hint.endTimeMustAfterStart': 'End time must be after start time',
  'reservation.hint.customTimeConfirmed': 'Time period confirmed',
  'reservation.hint.customTimeCancelled': 'Custom period cancelled',

  // Seat map component
  'reservation.seatMap.title': 'Seat Selection',
  'reservation.seatMap.subtitle': 'Tap to select or deselect seat',
  'reservation.seatMap.window': 'Window',
  'reservation.seatMap.legend.available': 'Available',
  'reservation.seatMap.legend.booked': 'Booked',
  'reservation.seatMap.legend.maintenance': 'Maintenance',
  'reservation.seatMap.legend.selected': 'Selected',
  'reservation.seatMap.legend.mine': 'My Reservation',
  'reservation.seatMap.legend.available.desc': '(Available for reservation)',
  'reservation.seatMap.legend.booked.desc': '(Already booked by others)',
  'reservation.seatMap.legend.maintenance.desc': '(Temporarily unavailable)',
  'reservation.seatMap.legend.selected.desc': '(Seat you selected)',
  'reservation.seatMap.legend.mine.desc': '(Your booked seat)',
  'reservation.seatMap.instruction': 'Tap available seat to select, tap again to deselect',
  'reservation.seatMap.tooltip.basic': 'Standard seat, tap to view more location details.',
  'reservation.status.available': 'Available',
  'reservation.status.booked': 'Booked',
  'reservation.status.maintenance': 'Maintenance',
  'reservation.status.selected': 'Selected',
  'reservation.info.bookedTimeRange': 'Booked Time',
  'reservation.info.timeRange': 'Time Info',
};
