/**
 * 座位相关 API
 */

import { createApi } from '../utils/helpers';

const seatsApi = createApi('/api/seats');

/**
 * 获取楼层列表
 * GET /api/seats/floors
 */
export const getFloors = (requestOptions?: { showLoading?: boolean }) =>
  seatsApi.get('/floors', null, { showLoading: requestOptions?.showLoading ?? true });

/**
 * 获取楼层座位
 * GET /api/seats/floor/:floorId
 */
export const getFloorSeats = (
  floorId: string,
  params?: any,
  requestOptions?: { showLoading?: boolean }
) =>
  seatsApi.get(`/floor/${floorId}`, params, { showLoading: requestOptions?.showLoading ?? true });

/**
 * 获取座位详情
 * GET /api/seats/:id
 */
export const getSeatDetail = (seatId: string, params?: any) => seatsApi.get(`/${seatId}`, params);

/**
 * 搜索座位
 * GET /api/seats/search
 */
export const searchSeats = (keyword: string, params?: any) =>
  seatsApi.get('/search', { keyword, ...params }, { showLoading: true });

export default {
  getFloors,
  getFloorSeats,
  getSeatDetail,
  searchSeats,
};
