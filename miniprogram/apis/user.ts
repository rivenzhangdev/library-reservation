/**
 * 用户相关 API
 */

import { createApi } from '../utils/helpers';

const userApi = createApi('/api/user');

/**
 * 获取用户信息
 * GET /api/user/profile
 */
export const getProfile = () => userApi.get('/profile', null, { needAuth: true });

/**
 * 更新用户信息
 * PUT /api/user/profile
 */
export const updateProfile = (data: any) =>
  userApi.put('/profile', data, {
    needAuth: true,
    showLoading: true,
  });

/**
 * 获取用户设置
 * GET /api/user/settings
 */
export const getSettings = () => userApi.get('/settings', null, { needAuth: true });

/**
 * 更新用户设置
 * PUT /api/user/settings
 */
export const updateSettings = (data: any) =>
  userApi.put('/settings', data, {
    needAuth: true,
    showLoading: true,
  });

/**
 * 收藏/取消收藏座位
 * POST /api/user/favorite/:seatId
 */
export const favoriteSeat = (seatId: string) =>
  userApi.post(`/favorite/${seatId}`, null, { needAuth: true });

/**
 * 获取收藏座位列表
 * GET /api/user/favorites
 */
export const getFavorites = () => userApi.get('/favorites', null, { needAuth: true });

/**
 * 获取信用积分
 * GET /api/user/credit
 */
export const getCredit = () => userApi.get('/credit', null, { needAuth: true });

/**
 * 获取信用记录
 * GET /api/user/credit/records
 */
export const getCreditRecords = (params?: any) =>
  userApi.get('/credit/records', params, { needAuth: true });

export default {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  favoriteSeat,
  getFavorites,
  getCredit,
  getCreditRecords,
};
