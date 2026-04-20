/**
 * 活动相关 API
 */

import { createApi } from '../utils/helpers';

const activityApi = createApi('/api/activity');

/**
 * 获取活动列表
 * GET /api/activity
 */
export const getActivities = (params?: any) => activityApi.get('', params, { needAuth: false });

/**
 * 获取活动详情
 * GET /api/activity/:id
 */
export const getActivityDetail = (id: string) =>
  activityApi.get(`/${id}`, null, { needAuth: false });

/**
 * 报名活动
 * POST /api/activity/join/:id
 */
export const joinActivity = (id: string) =>
  activityApi.post(`/join/${id}`, null, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '报名中...',
  });

/**
 * 取消报名
 * POST /api/activity/cancel/:id
 */
export const cancelActivity = (id: string) =>
  activityApi.post(`/cancel/${id}`, null, { needAuth: true });

/**
 * 活动签到
 * POST /api/activity/checkin/:id
 */
export const checkinActivity = (id: string) =>
  activityApi.post(`/checkin/${id}`, null, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '签到中...',
  });

/**
 * 活动签退
 * POST /api/activity/checkout/:id
 */
export const checkoutActivity = (id: string) =>
  activityApi.post(`/checkout/${id}`, null, {
    needAuth: true,
    showLoading: true,
    loadingTitle: '签退中...',
  });

export default {
  getActivities,
  getActivityDetail,
  joinActivity,
  cancelActivity,
  checkinActivity,
  checkoutActivity,
};
