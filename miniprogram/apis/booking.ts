/**
 * 预约相关 API
 */

import { createApi } from '../utils/helpers';

const bookingApi = createApi('/api/booking');

/**
 * 创建预约
 * POST /api/booking
 */
export const createBooking = (data: any) =>
  bookingApi.post('', data, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '预约中...',
  });

/**
 * 获取我的预约列表
 * GET /api/booking/my
 */
export const getMyBookings = (params?: any) =>
  bookingApi.get('/my', params, {
    needAuth: true,
    showLoading: true,
  });

/**
 * 获取预约详情
 * GET /api/booking/:id
 */
export const getBookingDetail = (id: string) => bookingApi.get(`/${id}`, null, { needAuth: true });

/**
 * 取消预约
 * DELETE /api/booking/:id
 */
export const cancelBooking = (id: string) =>
  bookingApi.delete(`/${id}`, null, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '取消中...',
  });

/**
 * 预约签到
 * POST /api/booking/checkin/:id
 */
export const checkin = (id: string, location?: any) =>
  bookingApi.post(`/checkin/${id}`, location, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '签到中...',
  });

/**
 * 预约续约
 * POST /api/booking/renew/:id
 */
export const renewBooking = (id: string, timeSlot: number, location?: any) =>
  bookingApi.post(
    `/renew/${id}`,
    { timeSlot, location },
    {
      needAuth: true,
      showLoading: true,
    }
  );

/**
 * 预约签退
 * POST /api/booking/checkout/:id
 */
export const checkout = (id: string, location?: any) =>
  bookingApi.post(`/checkout/${id}`, location, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '签退中...',
  });

export default {
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  checkin,
  checkout,
  renewBooking,
};
