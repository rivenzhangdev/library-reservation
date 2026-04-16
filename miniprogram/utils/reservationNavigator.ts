const PENDING_RESERVATION_PARAMS_KEY = 'reservation_pending_params';

export type ReservationPendingParams = Record<string, any> & {
  date?: string;
  timeSlotId?: string;
  timeSlotName?: string;
  startTime?: string;
  endTime?: string;
};

export function setPendingReservationParams(params: ReservationPendingParams) {
  wx.setStorageSync(PENDING_RESERVATION_PARAMS_KEY, params);
}

export function consumePendingReservationParams(): ReservationPendingParams | null {
  const params = wx.getStorageSync(PENDING_RESERVATION_PARAMS_KEY) as ReservationPendingParams;
  if (params && Object.keys(params).length > 0) {
    wx.removeStorageSync(PENDING_RESERVATION_PARAMS_KEY);
    return params;
  }
  return null;
}

export function openReservationWithParams(params: ReservationPendingParams) {
  setPendingReservationParams(params);
  wx.switchTab({
    url: '/pages/reservation/reservation',
  });
}

export { PENDING_RESERVATION_PARAMS_KEY };
