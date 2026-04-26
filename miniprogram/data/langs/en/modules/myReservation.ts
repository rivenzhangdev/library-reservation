// My Reservation page English language pack
export default {
  'myReservation.search.placeholder': 'Search seat number, area...',
  'myReservation.action.checkin': 'Check-in',
  'myReservation.action.checkout': 'Check-out',
  'myReservation.action.renew': 'Renew',
  'myReservation.action.cancel': 'Cancel Reservation',
  'myReservation.confirm.checkinTitle': 'Confirm Check-in',
  'myReservation.confirm.checkinContent':
    'Confirm that you have arrived at the seat and checked in?',
  'myReservation.confirm.checkoutTitle': 'Confirm Check-out',
  'myReservation.confirm.checkoutContent': 'Confirm to check out this reservation?',
  'myReservation.confirm.renewTitle': 'Confirm Renewal',
  'myReservation.confirm.renewContent': 'Confirm to renew this reservation?',
  'myReservation.confirm.cancelTitle': 'Cancel Reservation',
  'myReservation.confirm.cancelContent': 'Confirm to cancel this reservation?',
  'myReservation.hint.renewSuccess': 'Renewal successful',
  'myReservation.hint.renewFailed': 'Renewal failed, this time slot may already be occupied',
  'myReservation.hint.renewFailedConflict': 'Renewal failed: overlaps with your other booking time',
  'myReservation.hint.renewNoSlot':
    'No renewable slot now, possibly occupied or overlapping with your own bookings',
  'myReservation.hint.renewNoSlotReason':
    'No available slots for renewal — the following slots may be full or you have reached the renewal limit.',
  'myReservation.hint.renewBlocked.noLaterTimeSlot':
    'This booking already ends at the last enabled slot of the day, so it cannot be renewed further.',
  'myReservation.hint.renewBlocked.limitReached': 'Renewal limit reached for this booking.',
  'myReservation.hint.renewBlocked.slotUnavailableOrConflict':
    'Later slots are occupied or conflict with your other bookings, so renewal is unavailable.',
  'myReservation.hint.renewGuide': 'Renewable slots: {slots}',
  'myReservation.hint.renewGuide.sameDay':
    'Renewable slots: {slots} (renewal supports later slots on the booking date only; other slots may be occupied or conflict with your own bookings)',
  'myReservation.hint.renewGuide.advanceDays':
    'Renewable slots: {slots} (renewal supports later slots on the booking date and within the previous {days} day(s); other slots may be occupied or conflict with your own bookings)',
  'myReservation.hint.renewTodayOnly':
    'Renewal is only available on the booking date. Please renew on the same day.',
  'myReservation.hint.renewWindow.sameDay':
    'Renewal is only available on the booking date. Please renew on the same day.',
  'myReservation.hint.renewWindow.advanceDays':
    'Renewal is available within {days} day(s) before the booking date. Please renew within the allowed window.',
  'myReservation.hint.renewLimitExceeded':
    'Renewal failed: exceeds the current maximum renewable extra slots',
  'myReservation.hint.renewSlotUnavailable':
    'Renewal failed: target slot is unavailable (occupied or under maintenance)',
  'myReservation.hint.loadFailed': 'Failed to load reservation details',
  'myReservation.field.date': 'Date',
  'myReservation.field.time': 'Time',
  'myReservation.field.zone': 'Area',
  'myReservation.field.bookingId': 'Booking ID',
  'myReservation.field.bookingDate': 'Booking Date',
  'myReservation.field.bookingTime': 'Booking Time',
  'myReservation.field.region': 'Region',
  'myReservation.field.seatType': 'Seat Type',
  'myReservation.field.signInTime': 'Check-in Time',
  'myReservation.field.capacity': 'Capacity',
  'myReservation.field.environment': 'Environment',
  'myReservation.field.openTime': 'Open Time',
  'myReservation.field.powerSocket': 'Power Socket',
  'myReservation.environment.light': 'Bright Lighting',
  'myReservation.environment.quiet': 'Quiet Study',
  'myReservation.suffix.people': 'people',
  'myReservation.tip.title': 'Friendly Tips',
  'myReservation.tip.arriveBefore':
    'Please arrive at the library 15 minutes before your booking starts',
  'myReservation.tip.cancelBefore': 'If you need to cancel, please do so 30 minutes in advance',
  'myReservation.tip.creditPenalty': 'Three consecutive violations may affect your credit score',
  'myReservation.hint.violatedPenalty':
    'This booking has been violated and may affect your credit score. Please keep future reservations on-time.',
  'myReservation.tip.keepQuiet': 'Keep quiet and help maintain a good study environment',
  'myReservation.detail.title': 'Reservation Details',
  'myReservation.detail.seatInfo': 'Seat Info',
  'myReservation.detail.bookingInfo': 'Reservation Info',
  'myReservation.detail.auditInfo': 'Audit Info',
  'myReservation.example.zone1Floor2Window': 'Area A, 2F, Window Seat',
  'myReservation.example.zone3Floor3StudyRoom': 'Area B, 3F, Study Room',
  'myReservation.example.zone1Floor5SingleDesk': 'Area A, 5F, Single Desk',
  'myReservation.example.readingAreaSingleDesk': 'Reading Area Single Desk',
  'myReservation.example.studyAreaDiscussionTable': 'Study Area Discussion Table',
  'myReservation.date.today': 'Today',
  'myReservation.date.tomorrow': 'Tomorrow',
  'myReservation.time.period': 'Time Period',

  // Renewal time slot selection
  'myReservation.renew.selectTimeSlot': 'Select renewal time slot',
  'myReservation.renew.targetSlot': 'Renew to: {slot}',
  'myReservation.action.changeRequest': 'Change Request',
  'myReservation.changeRequest.options.cancel': 'Submit cancel request',
  'myReservation.changeRequest.options.reschedule': 'Submit date/time-slot change request',
  'myReservation.changeRequest.options.seatChange': 'Submit seat change request',
  'myReservation.changeRequest.confirm.cancelTitle': 'Submit cancel request',
  'myReservation.changeRequest.confirm.cancelContent':
    'This will enter the admin approval queue. Continue?',
  'myReservation.changeRequest.confirm.rescheduleTitle': 'Submit date/time-slot change request',
  'myReservation.changeRequest.confirm.rescheduleContent':
    'Target date: {date}, target slot: {slot}. This will enter the admin approval queue. Continue?',
  'myReservation.changeRequest.confirm.seatChangeTitle': 'Submit seat change request',
  'myReservation.changeRequest.confirm.seatChangeContent':
    'Target seat: {seat}. This will enter the admin approval queue. Continue?',
  'myReservation.changeRequest.hint.submitSuccess':
    'Change request submitted and pending admin approval',
  'myReservation.changeRequest.hint.submitFailed': 'Submission failed, please try again later',
  'myReservation.changeRequest.hint.renewConflict':
    'Please use renewal for that target slot; reschedule request is not supported for it',
  'myReservation.changeRequest.hint.targetUnavailable':
    'Submission failed: target seat or slot is no longer available, please choose another one',
  'myReservation.changeRequest.hint.limitExceeded':
    'Change request limit for this booking has been reached, please contact admin',
  'myReservation.changeRequest.hint.invalidTarget':
    'Target date or slot is invalid, please choose another available slot',
  'myReservation.changeRequest.hint.sameTimeSlot':
    'Target slot cannot be the same as the current booking slot, please choose another slot',
  'myReservation.changeRequest.hint.bookingNotFound':
    'Submission failed: original booking does not exist or has expired, please refresh and retry',
  'myReservation.changeRequest.hint.adminRequired':
    'Submission failed: current account has no permission for this operation',
  'myReservation.changeRequest.hint.duplicate': 'A pending request already exists for this booking',
  'myReservation.changeRequest.hint.duplicateWithId':
    'A pending request already exists for this booking (request ID: {id})',
  'myReservation.changeRequest.hint.noRescheduleSlot':
    'No eligible reschedule slot right now, possibly due to overlap with your other bookings',
  'myReservation.changeRequest.hint.loadingSeatOptions': 'Loading available seats...',
  'myReservation.changeRequest.hint.loadingTimeSlots': 'Loading time slots...',
  'myReservation.changeRequest.hint.noSeatCandidate': 'No eligible target seat at this moment',
  'myReservation.changeRequest.hint.loadSeatFailed':
    'Failed to load seat options, please try again later',
  'myReservation.changeRequest.hint.loadTimeSlotsFailed':
    'Failed to load time slots, please try again later',
  'myReservation.changeRequest.hint.seatKeywordPlaceholder': 'Enter floor/zone/seat keyword',
  'myReservation.changeRequest.hint.seatKeywordRequired': 'Please enter a seat keyword',
  'myReservation.changeRequest.date.today': 'Today',
  'myReservation.changeRequest.date.tomorrow': 'Tomorrow',
  'myReservation.changeRequest.reason.title': 'Enter request reason',
  'myReservation.changeRequest.reason.placeholder': 'Please describe why you need this change',
  'myReservation.changeRequest.reason.required': 'Please provide a reason before submitting',
  'myReservation.changeRequest.options.pickSeatRecommended': 'Pick from recommended seat list',
  'myReservation.changeRequest.options.searchSeatByKeyword': 'Search seat by keyword',
  'myReservation.changeRequest.options.moreSeatCandidates': 'Show more seats',
  'myReservation.changeRequest.options.moreDateCandidates': 'Show more dates',
};
